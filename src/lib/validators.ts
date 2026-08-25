import { z } from "zod";

import {
  BUDGETS,
  CONTACT_METHODS,
  SERVICES,
  STAGE_VALUES,
  TIERS,
  TIMELINES,
} from "./leads";

/** Accepts a textarea where each line is one entry; blank lines are dropped. */
const lines = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug bo'sh bo'lmasin")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Faqat kichik harf, raqam va tire");

/**
 * A URL field that is allowed to be empty.
 *
 * `z.url().optional()` would still reject `""`, which is what an untouched text
 * input actually submits — so blank is normalised away before validation runs.
 */
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .default("")
  .refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), "To'liq havola kerak: https://...");

/** Prices are whole currency units; the panel must never store a stray "12.5". */
const money = z.coerce.number().int().min(0).max(1_000_000).default(0);

const currency = z.enum(["USD", "UZS", "EUR"]).default("USD");

export const projectSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Sarlavha kerak").max(120),
  summary: z.string().trim().min(1, "Qisqacha tavsif kerak").max(400),
  category: z.enum(["SI", "Mahsulot", "Tizim"]),
  year: z.string().trim().regex(/^\d{4}$/, "Yil 4 raqam bo'lsin"),
  role: z.string().trim().max(120).default(""),
  client: z.string().trim().max(120).default(""),
  tone: z.enum(["gold", "azure", "green", "violet"]).default("gold"),
  overview: z.string().trim().max(2000).default(""),
  problem: z.string().trim().max(2000).default(""),
  research: z.string().trim().max(2000).default(""),
  solution: z.string().trim().max(2000).default(""),
  process: z.string().trim().max(2000).default(""),
  stack: lines,
  /** "143 | O'tgan test" per line */
  metrics: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split("\n")
        .map((line) => line.split("|").map((s) => s.trim()))
        .filter(([value, label]) => value && label)
        .map(([value, label]) => ({ value, label })),
    ),
  sourceKind: z.enum(["github", "vercel", "manual"]).default("manual"),
  sourceUrl: optionalUrl,
  /** The deployed site. Screenshots are taken of this, not of `sourceUrl`. */
  liveUrl: optionalUrl,
  /** Written by the capture action; carried through the form as a hidden field. */
  previewImage: z.string().trim().max(300).default(""),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(1, "Nomi kerak").max(120),
  duration: z.string().trim().max(60).default(""),
  description: z.string().trim().max(1000).default(""),
  features: lines,
  price: money,
  currency,
  priceFrom: z.coerce.boolean().default(false),
  priceNote: z.string().trim().max(120).default(""),
  highlighted: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export const productSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Nomi kerak").max(120),
  summary: z.string().trim().max(400).default(""),
  description: z.string().trim().max(4000).default(""),
  price: money,
  currency,
  priceNote: z.string().trim().max(120).default(""),
  demoUrl: optionalUrl,
  sourceKind: z.enum(["github", "vercel", "manual"]).default("manual"),
  sourceUrl: optionalUrl,
  previewImage: z.string().trim().max(300).default(""),
  stack: lines,
  includes: lines,
  category: z.enum(["Biznes", "Do'kon", "Landing", "Portfolio", "Panel"]).default("Biznes"),
  status: z.enum(["available", "reserved", "sold"]).default("available"),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

/** A booking or a purchase request placed from the public site. */
export const orderSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni yozing").max(80),
  email: z.email("Email noto'g'ri").max(160),
  phone: z.string().trim().max(40).default(""),
  brief: z.string().trim().max(2000).default(""),
  preferredStart: z.string().trim().max(80).default(""),
  /** Honeypot — real people never fill a field they cannot see. */
  website: z.string().max(0).optional().default(""),
});

export const orderStatusSchema = z.enum([
  "new",
  "contacted",
  "scheduled",
  "paid",
  "done",
  "declined",
]);

/** Empty integration fields preserve the encrypted value already in the database. */
export const integrationsSchema = z.object({
  githubToken: z.string().trim().max(500).default(""),
  vercelToken: z.string().trim().max(500).default(""),
  screenshotApiUrl: z.string().trim().max(500).default(""),
});

export const postSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Sarlavha kerak").max(160),
  excerpt: z.string().trim().max(400).default(""),
  body: z.string().trim().max(20000).default(""),
  topic: z.string().trim().max(80).default(""),
  readMinutes: z.coerce.number().int().min(1).max(90).default(5),
  published: z.coerce.boolean().default(true),
});

/**
 * A select whose options are fixed, but which is allowed to arrive empty.
 *
 * `z.enum([...])` would reject `""`, and `""` is exactly what an untouched
 * select submits — every one of these fields is optional. Anything that is
 * neither blank nor a known option is a forged submission, and is dropped to
 * blank rather than rejected: a bot posting `budget=<script>` should not be
 * able to fail a real person's form.
 */
const choice = (allowed: readonly string[]) =>
  z
    .string()
    .trim()
    .default("")
    .transform((v) => (allowed.includes(v) ? v : ""));

export const messageSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni yozing").max(80),
  email: z.email("Email noto'g'ri").max(160),
  body: z.string().trim().min(10, "Kamida 10 ta belgi").max(4000),

  // The optional qualifying block. None of it can fail the form.
  company: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(40).default(""),
  service: choice(SERVICES.map((c) => c.value)),
  tier: choice(TIERS.map((c) => c.value)),
  budget: choice(BUDGETS.map((c) => c.value)),
  timeline: choice(TIMELINES.map((c) => c.value)),
  preferredContact: choice(CONTACT_METHODS.map((c) => c.value)),

  /** Honeypot — real people never fill a field they cannot see. */
  website: z.string().max(0).optional().default(""),
});

export const leadStatusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(STAGE_VALUES),
});

export const leadNotesSchema = z.object({
  id: z.coerce.number().int().positive(),
  notes: z.string().trim().max(4000).default(""),
});

/**
 * One catalogue row as the panel edits it.
 *
 * Copy and structure stay out of this form on purpose — a name or a summary is
 * a writing decision, and mixing it into the screen used for repricing turns a
 * two-minute price change into a page of fields to scroll past.
 */
export const catalogPriceSchema = z.object({
  id: z.coerce.number().int().positive(),
  basePrice: money,
  minimumPrice: money,
  weeksMin: z.coerce.number().int().min(0).max(104).default(0),
  weeksMax: z.coerce.number().int().min(0).max(104).default(0),
  published: z.coerce.boolean().default(false),
});

/** One configurator option's numbers. */
export const optionPriceSchema = z.object({
  id: z.coerce.number().int().positive(),
  /** Whole currency for `flat`; basis points for `multiplier`. */
  amount: z.coerce.number().int().min(0).max(1_000_000).default(0),
  monthly: money,
  externalMin: money,
  externalMax: money,
  weeks: z.coerce.number().int().min(0).max(52).default(0),
  active: z.coerce.boolean().default(false),
});

/**
 * Contact details attached to a saved estimate.
 *
 * Routing this through the contact form would have created a second record
 * describing the same enquiry — a message saying "see EST-2026-…" beside an
 * estimate that already carries the scope, the price and the buyer's own words.
 * The estimate row has the fields; filling them is what turns it into a lead.
 */
export const estimateContactSchema = z.object({
  publicId: z.string().trim().min(6).max(40),
  name: z.string().trim().min(2, "Ismingizni yozing").max(80),
  email: z.email("Email noto'g'ri").max(160),
  phone: z.string().trim().max(40).default(""),
  company: z.string().trim().max(120).default(""),
  /** Honeypot — real people never fill a field they cannot see. */
  website: z.string().max(0).optional().default(""),
});

export const estimateStatusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["draft", "submitted", "reviewing", "quoted", "accepted", "declined"]),
});

export const estimateNotesSchema = z.object({
  id: z.coerce.number().int().positive(),
  notes: z.string().trim().max(4000).default(""),
});

export const loginSchema = z.object({
  email: z.email("Email noto'g'ri"),
  password: z.string().min(1, "Parol kerak"),
});

export const settingsSchema = z.object({
  availability: z.enum(["open", "limited", "closed"]),
  availabilityLabel: z.string().trim().min(1).max(80),
  heroEyebrow: z.string().trim().min(1).max(120),
  heroLine1: z.string().trim().min(1).max(60),
  heroLine2: z.string().trim().max(60).default(""),
  heroAccent: z.string().trim().max(40).default(""),
  heroSubline: z.string().trim().max(400),
  aboutTitle: z.string().trim().max(200),
  aboutBody: z.string().trim().max(3000),
  email: z.email(),
  telegram: z.string().trim().max(80).default(""),
  github: z.string().trim().max(120).default(""),
  linkedin: z.string().trim().max(120).default(""),
  location: z.string().trim().max(80).default(""),
  /** Whole USD floors for the two priced tiers. Dragon is quoted, not listed. */
  planDogPrice: money,
  planWolfPrice: money,
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type MessageInput = z.infer<typeof messageSchema>;

export type Metric = { value: string; label: string };

/** Columns are stored as JSON text; never let a bad row take a page down. */
export function parseJson<T>(raw: string, fallback: T): T {
  try {
    const parsed: unknown = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}
