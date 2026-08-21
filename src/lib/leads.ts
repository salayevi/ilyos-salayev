/**
 * The vocabulary of an enquiry — shared by the public form, the validator and
 * the panel, so a value written on one side always has a label on the other.
 *
 * Everything here is a closed set on purpose. Free-text budget and timeline
 * fields produce answers like "not much" and "asap", which cannot be sorted,
 * filtered or compared; a handful of buckets can. The cost is that the sender
 * sometimes cannot say exactly what they mean, which is what the message body
 * is for.
 */

export type Choice = { value: string; label: string };

export const SERVICES: Choice[] = [
  { value: "web", label: "Sayt va veb-ilova" },
  { value: "fullstack", label: "Full-stack tizim" },
  { value: "uiux", label: "UI/UX dizayn" },
  { value: "mobile", label: "Mobil ilova" },
  { value: "ai", label: "AI va avtomatlashtirish" },
  { value: "ecommerce", label: "Onlayn savdo" },
  { value: "ready", label: "Tayyor sayt" },
  { value: "other", label: "Boshqa" },
];

/**
 * Buckets, not figures, and the first two are deliberately the Dog and Wolf
 * ranges — someone who arrives from /pricing recognises the band they just
 * read about instead of having to translate it.
 */
export const BUDGETS: Choice[] = [
  { value: "500-1500", label: "$500 – $1 500" },
  { value: "1500-5000", label: "$1 500 – $5 000" },
  { value: "5000-15000", label: "$5 000 – $15 000" },
  { value: "15000+", label: "$15 000 dan yuqori" },
  { value: "unknown", label: "Hali aniq emas" },
];

export const TIMELINES: Choice[] = [
  { value: "urgent", label: "Shoshilinch — 2 haftagacha" },
  { value: "1-2m", label: "1–2 oy" },
  { value: "3-6m", label: "3–6 oy" },
  { value: "flexible", label: "Muddat qat'iy emas" },
];

export const CONTACT_METHODS: Choice[] = [
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "phone", label: "Telefon" },
];

export const TIERS: Choice[] = [
  { value: "dog", label: "Dog" },
  { value: "wolf", label: "Wolf" },
  { value: "dragon", label: "Dragon" },
];

/**
 * The pipeline. `tone` maps a stage to the status colours already in the token
 * set, so the panel can show state as colour without inventing a second
 * palette: open stages stay neutral, active negotiation warms up, and the two
 * terminal stages read as settled.
 */
export type Stage = {
  value: string;
  label: string;
  tone: "neutral" | "info" | "warn" | "ok" | "bad";
};

export const PIPELINE: Stage[] = [
  { value: "new", label: "Yangi", tone: "info" },
  { value: "contacted", label: "Bog'lanildi", tone: "neutral" },
  { value: "qualified", label: "Malakali", tone: "neutral" },
  { value: "proposal", label: "Taklif yuborildi", tone: "warn" },
  { value: "negotiation", label: "Kelishuv", tone: "warn" },
  { value: "won", label: "Yutildi", tone: "ok" },
  { value: "lost", label: "Yo'qotildi", tone: "bad" },
];

export const STAGE_VALUES = PIPELINE.map((s) => s.value) as [string, ...string[]];

/** Values are stored as written; a label lookup must never throw on old rows. */
function lookup(list: Choice[], value: string): string {
  return list.find((c) => c.value === value)?.label ?? value;
}

export const serviceLabel = (v: string) => lookup(SERVICES, v);
export const budgetLabel = (v: string) => lookup(BUDGETS, v);
export const timelineLabel = (v: string) => lookup(TIMELINES, v);
export const contactLabel = (v: string) => lookup(CONTACT_METHODS, v);
export const tierLabel = (v: string) => lookup(TIERS, v);
export const stageOf = (v: string): Stage => PIPELINE.find((s) => s.value === v) ?? PIPELINE[0];
