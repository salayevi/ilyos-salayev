"use server";

import { createHash, randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, services } from "@/db/schema";
import { getSettings } from "@/lib/queries";
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
  const confirmationToken = randomBytes(24).toString("base64url");
  const customerTokenHash = tokenHash(confirmationToken);
  const settings = await getSettings();
  const ownerTelegram = telegramUsername(settings.telegram);

  if (kind === "product") {
    const [row] = await db.select().from(products).where(eq(products.id, itemId)).limit(1);
    if (!row || !row.published) return { status: "error", message: "Bu sayt topilmadi" };
    if (row.status !== "available") {
      return {
        status: "error",
        message: row.status === "sold" ? "Bu sayt allaqachon sotilgan" : "Bu sayt hozir band qilingan",
      };
    }

    // One conditional write claims the listing before the order is written.
    // Two buyers can never both pass this update, even from separate devices.
    const [reserved] = await db
      .update(products)
      .set({ status: "reserved", updatedAt: new Date() })
      .where(and(eq(products.id, row.id), eq(products.status, "available"), eq(products.published, true)))
      .returning({ id: products.id });
    if (!reserved) return { status: "error", message: "Bu sayt hozir band qilingan" };

    const [order] = await db.insert(orders).values({
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
  const id = Number(formData.get("orderId"));
  const token = String(formData.get("confirmationToken") ?? "");
  if (!Number.isSafeInteger(id) || id <= 0 || token.length < 20) {
    return { error: "Tasdiqlash havolasi noto'g'ri" };
  }

  const [row] = await db
    .select({ customerTokenHash: orders.customerTokenHash, telegramConfirmedAt: orders.telegramConfirmedAt })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!row || row.customerTokenHash !== tokenHash(token)) {
    return { error: "Tasdiqlash havolasi eskirgan" };
  }
  if (!row.telegramConfirmedAt) {
    await db.update(orders).set({ telegramConfirmedAt: new Date() }).where(eq(orders.id, id));
  }
  return { ok: true };
}
