"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { estimates } from "@/db/schema";
import { calculate, type Selections } from "@/lib/pricing/engine";
import { getCatalogService, getPricingConfig } from "@/lib/queries";
import { checkRate, clientKey } from "@/lib/rate-limit";
import { estimateContactSchema } from "@/lib/validators";

/**
 * A reference a person can read out over the phone.
 *
 * Deliberately random rather than sequential. `EST-2026-000123` invites
 * anyone holding one to try `000124`, and the page behind it carries a
 * stranger's project scope and budget. Six characters from an alphabet with
 * no `0/O` or `1/I` is unguessable and still dictatable without spelling it.
 */
function publicId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let token = "";
  for (const byte of bytes) token += alphabet[byte % alphabet.length];
  return `EST-${new Date().getFullYear()}-${token}`;
}

function parseSelections(raw: string): Selections {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Selections = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
      else if (Array.isArray(value)) out[key] = value.filter((v): v is string => typeof v === "string");
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Saves what the visitor configured.
 *
 * The price is recomputed here from the catalogue rows rather than read out of
 * the submitted form. The browser ran the same function and showed a number,
 * but that number arrived over the wire and anything that arrives over the
 * wire can be edited — an estimate is a commercial document and must be
 * derived from data only the server controls.
 */
export async function saveEstimate(formData: FormData) {
  const rate = checkRate(clientKey(await headers(), "estimate"), 20);
  if (!rate.allowed) redirect("/pricing?xato=limit");

  const slug = String(formData.get("service") ?? "").trim();
  const service = await getCatalogService(slug);
  if (!service || !service.published) redirect("/pricing?xato=xizmat");

  const config = await getPricingConfig();
  // Only the steps this service actually asks about; anything else in the
  // payload is ignored rather than priced.
  const groups = config.groups.filter((g) => service.groups.includes(g.key));
  const groupKeys = new Set(groups.map((g) => g.key));
  const options = config.options.filter((o) => groupKeys.has(o.groupKey));

  const selections = parseSelections(String(formData.get("selections") ?? "{}"));
  const idea = String(formData.get("idea") ?? "").trim().slice(0, 4000);

  const result = calculate(
    {
      slug: service.slug,
      name: service.name,
      basePrice: service.basePrice,
      minimumPrice: service.minimumPrice,
      currency: service.currency,
      weeksMin: service.weeksMin,
      weeksMax: service.weeksMax,
    },
    groups,
    options,
    selections,
  );

  const id = publicId();
  await db.insert(estimates).values({
    publicId: id,
    serviceSlug: service.slug,
    selections: JSON.stringify(selections),
    breakdown: JSON.stringify(result.lines),
    idea,
    oneTime: result.oneTime,
    monthly: result.monthly,
    externalMin: result.externalMin,
    externalMax: result.externalMax,
    weeksMin: result.weeksMin,
    weeksMax: result.weeksMax,
    currency: result.currency,
    isRange: result.isRange,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    status: "draft",
  });

  redirect(`/hisob/${id}`);
}

export type EstimateContactState = {
  status: "idle" | "error" | "success";
  errors?: Partial<Record<"name" | "email", string>>;
  message?: string;
};

/**
 * Turns a saved estimate into a lead.
 *
 * Writes the contact details onto the estimate itself and moves it out of
 * `draft`. The figures are left exactly as they were computed — this is the
 * moment the quote becomes something both sides refer to, so recalculating it
 * here would silently reprice the thing the buyer just agreed to send.
 */
export async function submitEstimate(
  _prev: EstimateContactState,
  formData: FormData,
): Promise<EstimateContactState> {
  const rate = checkRate(clientKey(await headers(), "estimate-submit"), 10);
  if (!rate.allowed) {
    return { status: "error", message: "Juda ko'p urinish. Biroz kutib, qayta yuboring." };
  }

  const parsed = estimateContactSchema.safeParse({
    publicId: formData.get("publicId") ?? "",
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    company: formData.get("company") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const errors: NonNullable<EstimateContactState["errors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email") errors[field] ??= issue.message;
    }
    return {
      status: "error",
      errors,
      message: Object.keys(errors).length ? undefined : "Yuborilmadi. Qayta urinib ko'ring.",
    };
  }

  const d = parsed.data;
  const [row] = await db
    .select({ id: estimates.id, status: estimates.status })
    .from(estimates)
    .where(eq(estimates.publicId, d.publicId))
    .limit(1);

  if (!row) return { status: "error", message: "Bu hisob topilmadi." };
  // Re-sending after the conversation has already moved on would drag the
  // estimate backwards through the pipeline; the details still update.
  const nextStatus = row.status === "draft" ? "submitted" : row.status;

  await db
    .update(estimates)
    .set({
      name: d.name,
      email: d.email,
      phone: d.phone,
      company: d.company,
      status: nextStatus,
    })
    .where(eq(estimates.id, row.id));

  revalidatePath("/admin/estimates", "page");
  return { status: "success" };
}
