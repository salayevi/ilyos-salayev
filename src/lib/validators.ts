import { z } from "zod";

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
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(1, "Nomi kerak").max(120),
  duration: z.string().trim().max(60).default(""),
  description: z.string().trim().max(1000).default(""),
  features: lines,
  priceNote: z.string().trim().max(120).default(""),
  highlighted: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
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

export const messageSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni yozing").max(80),
  email: z.email("Email noto'g'ri").max(160),
  body: z.string().trim().min(10, "Kamida 10 ta belgi").max(4000),
  /** Honeypot — real people never fill a field they cannot see. */
  website: z.string().max(0).optional().default(""),
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
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

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
