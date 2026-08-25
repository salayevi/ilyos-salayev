"use server";

import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { orders, products, services } from "@/db/schema";
import { OPEN_ORDER_STATUSES } from "@/lib/inventory";
import { getSettings } from "@/lib/queries";
import { checkRate, clientKey } from "@/lib/rate-limit";
import { orderSchema } from "@/lib/validators";

// Types are erased at compile time, so they may be exported from here. A value
// may not: a "use server" module is only allowed to export async functions, and
// a plain object slips past `tsc`, ESLint and `next build` to fail at request
// time with a 500. The initial state therefore lives with its form.
export type OrderState = {
  status: "idle" | "error" | "success";
  errors?: Partial<Record<"name" | "email" | "phone" | "brief", string>>;
  message?: string;
  orderId?: number;
  confirmationToken?: string;
  telegramUrl?: string;
};

export type TelegramConfirmState = { ok?: boolean; error?: string };

/**
 * How long a hold survives without becoming an order.
 *
 * The buyer still has to send a Telegram message and come back to confirm, so
 * the window has to outlast a distraction. Thirty minutes is long enough for
 * that and short enough that a listing abandoned at lunchtime is buyable again
 * before the afternoon.
 */
const RESERVATION_MINUTES = 30;
const CONFIRMATION_MINUTES = 60;

/** Thrown inside the transaction so the rollback and the message share a path. */
class ListingUnavailable extends Error {
  constructor(readonly reason: "missing" | "reserved" | "sold") {
    super(reason);
  }
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function telegramUsername(raw: string) {
  const value = raw.trim().replace(/^https?:\/\/(?:www\.)?t\.me\//i, "").replace(/^@/, "");
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value) ? value : null;
}

function telegramMessage(input: {
  orderId: number;
  title: string;
  kind: "product" | "service";
  amount: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
  brief: string;
  preferredStart: string;
}) {
  const price = input.amount ? `${input.amount.toLocaleString("uz-UZ")} ${input.currency}` : "Kelishiladi";
  return [
    `Assalomu alaykum, ${input.kind === "product" ? "tayyor sayt" : "xizmat"} bo'yicha so'rov yubordim.`,
    "",
    `Buyurtma #${input.orderId}: ${input.title}`,
    `Narx: ${price}`,
    `Ism: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Telefon: ${input.phone}` : "",
    input.preferredStart ? `Qulay vaqt/to'lov: ${input.preferredStart}` : "",
    input.brief ? `Izoh: ${input.brief}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function toTelegramUrl(username: string | null, message: string) {
  return username ? `https://t.me/${username}?text=${encodeURIComponent(message)}` : undefined;
}

/**
 * Places a booking against a service tariff or a purchase request for a
 * ready-made site.
 *
 * The title and amount are read from the database rather than from the form:
 * the price is the one thing a buyer must not be able to choose, and a hidden
 * input is a suggestion, not a fact. Only the row id crosses the wire.
 */
export async function placeOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const requestHeaders = await headers();
  const ipVerdict = await checkRate(clientKey(requestHeaders, "order"), 5);
  if (!ipVerdict.allowed) {
    const minutes = Math.ceil(ipVerdict.retryAfterSeconds / 60);
    return {
      status: "error",
      message: `Juda ko'p urinish. ${minutes} daqiqadan keyin qayta urining.`,
    };
  }

  const parsed = orderSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    brief: formData.get("brief") ?? "",
    preferredStart: formData.get("preferredStart") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const errors: NonNullable<OrderState["errors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email" || field === "phone" || field === "brief") {
        errors[field] ??= issue.message;
      }
    }
    return {
      status: "error",
      errors,
      // The honeypot has no visible field to attach an error to, so a bot that
      // fills it gets the same generic failure a malformed form would get.
      message: Object.keys(errors).length ? undefined : "Yuborilmadi. Qayta urinib ko'ring.",
    };
  }

  const kind = formData.get("kind") === "product" ? "product" : "service";
  const itemId = Number(formData.get("itemId"));
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return { status: "error", message: "Buyurtma predmeti aniqlanmadi" };
  }

  const d = parsed.data;
  // A distributed script can rotate IPs; a hashed email budget stops one
  // identity from holding the whole shelf without storing that email in the
  // limiter table itself.
  const emailVerdict = await checkRate(`order-email:${tokenHash(d.email.toLowerCase())}`, 5);
  if (!emailVerdict.allowed) {
    return {
      status: "error",
      message: "Bu email bilan juda ko'p so'rov yuborildi. Birozdan keyin qayta urining.",
    };
  }

  const confirmationToken = randomBytes(24).toString("base64url");
  const customerTokenHash = tokenHash(confirmationToken);
  const settings = await getSettings();
  const ownerTelegram = telegramUsername(settings.telegram);

  if (kind === "product") {
    /*
      Lock, expire, claim and insert are one transaction. The row lock makes
      the product the serialization point: two buyers cannot both observe an
      available row, and an expired order is closed before its ownership key is
      replaced by a new buyer's key.
    */
    let result:
      | { id: number; title: string; amount: number; currency: string }
      | undefined;
    try {
      result = await db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(products)
          .where(eq(products.id, itemId))
          .limit(1)
          .for("update");

        if (!row || !row.published) throw new ListingUnavailable("missing");

        const now = new Date();
        const holdExpired =
          row.status === "reserved" &&
          (!row.reservedUntil || row.reservedUntil.getTime() <= now.getTime());

        if (holdExpired) {
          const ownership = row.reservationKey
            ? eq(orders.reservationKey, row.reservationKey)
            : isNull(orders.reservationKey);
          await tx
            .update(orders)
            .set({ status: "expired" })
            .where(
              and(
                eq(orders.kind, "product"),
                eq(orders.productId, row.id),
                ownership,
                inArray(orders.status, [...OPEN_ORDER_STATUSES]),
              ),
            );
          row.status = "available";
          row.reservedUntil = null;
          row.reservationKey = null;
        }

        if (row.status === "sold") throw new ListingUnavailable("sold");
        if (row.status !== "available") throw new ListingUnavailable("reserved");

        const reservationKey = randomBytes(24).toString("base64url");
        const reservedUntil = new Date(now.getTime() + RESERVATION_MINUTES * 60_000);
        const [claimed] = await tx
          .update(products)
          .set({
            status: "reserved",
            reservedUntil,
            reservationKey,
            updatedAt: now,
          })
          .where(
            and(
              eq(products.id, row.id),
              eq(products.status, "available"),
              eq(products.published, true),
            ),
          )
          .returning({ id: products.id });
        if (!claimed) throw new ListingUnavailable("reserved");

        const [created] = await tx
          .insert(orders)
          .values({
            kind: "product",
            productId: row.id,
            serviceTitle: row.title,
            amount: row.price,
            currency: row.currency,
            name: d.name,
            email: d.email,
            phone: d.phone,
            brief: d.brief,
            preferredStart: d.preferredStart,
            reservationKey,
            confirmationExpiresAt: reservedUntil,
            customerTokenHash,
          })
          .returning({ id: orders.id });
        return {
          id: created.id,
          title: row.title,
          amount: row.price,
          currency: row.currency,
        };
      });
    } catch (error) {
      if (error instanceof ListingUnavailable) {
        const message =
          error.reason === "missing"
            ? "Bu sayt topilmadi"
            : error.reason === "sold"
              ? "Bu sayt allaqachon sotilgan"
              : "Bu sayt hozir band qilingan";
        return { status: "error", message };
      }
      console.error("[orders] buyurtma yozib bo'lmadi:", error);
      return { status: "error", message: "Buyurtma saqlanmadi. Qayta urinib ko'ring." };
    }
    if (!result) return { status: "error", message: "Buyurtma saqlanmadi. Qayta urinib ko'ring." };
    const message = telegramMessage({
      orderId: result.id,
      title: result.title,
      kind,
      amount: result.amount,
      currency: result.currency,
      ...d,
    });
    return {
      status: "success",
      orderId: result.id,
      confirmationToken,
      telegramUrl: toTelegramUrl(ownerTelegram, message),
    };
  }

  const [row] = await db.select().from(services).where(eq(services.id, itemId)).limit(1);
  if (!row || !row.published) return { status: "error", message: "Bu xizmat topilmadi" };

  const [order] = await db.insert(orders).values({
    kind: "service",
    serviceId: row.id,
    serviceTitle: row.title,
    amount: row.price,
    currency: row.currency,
    name: d.name,
    email: d.email,
    phone: d.phone,
    brief: d.brief,
    preferredStart: d.preferredStart,
    confirmationExpiresAt: new Date(Date.now() + CONFIRMATION_MINUTES * 60_000),
    customerTokenHash,
  }).returning({ id: orders.id });
  const message = telegramMessage({ orderId: order.id, title: row.title, kind, amount: row.price, currency: row.currency, ...d });
  return {
    status: "success",
    orderId: order.id,
    confirmationToken,
    telegramUrl: toTelegramUrl(ownerTelegram, message),
  };
}

/** The acknowledgement is scoped by an unpredictable token, not a row id. */
export async function confirmTelegramOrder(
  _prev: TelegramConfirmState,
  formData: FormData,
): Promise<TelegramConfirmState> {
  const verdict = await checkRate(clientKey(await headers(), "order-confirm"), 12);
  if (!verdict.allowed) {
    return { error: "Juda ko'p urinish. Birozdan keyin qayta urining." };
  }

  const id = Number(formData.get("orderId"));
  const token = String(formData.get("confirmationToken") ?? "");
  if (!Number.isSafeInteger(id) || id <= 0 || token.length < 20) {
    return { error: "Tasdiqlash havolasi noto'g'ri" };
  }

  const [confirmed] = await db
    .update(orders)
    .set({
      telegramConfirmedAt: new Date(),
      // One successful acknowledgement consumes the token.
      customerTokenHash: "",
    })
    .where(
      and(
        eq(orders.id, id),
        eq(orders.customerTokenHash, tokenHash(token)),
        isNull(orders.telegramConfirmedAt),
        gt(orders.confirmationExpiresAt, new Date()),
        inArray(orders.status, [...OPEN_ORDER_STATUSES]),
      ),
    )
    .returning({ id: orders.id });
  if (!confirmed) return { error: "Tasdiqlash havolasi eskirgan yoki ishlatilgan" };
  return { ok: true };
}
