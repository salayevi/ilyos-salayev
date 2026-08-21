"use server";

import { randomBytes } from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { estimates } from "@/db/schema";
import { calculate, type Selections } from "@/lib/pricing/engine";
import { getCatalogService, getPricingConfig } from "@/lib/queries";
import { checkRate, clientKey } from "@/lib/rate-limit";

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
