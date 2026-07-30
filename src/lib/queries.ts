import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { messages, posts, projects, services, settings, testimonials } from "@/db/schema";
import { type Metric, parseJson } from "./validators";

export type ProjectView = Omit<
  typeof projects.$inferSelect,
  "stack" | "metrics"
> & {
  stack: string[];
  metrics: Metric[];
};

function toView(row: typeof projects.$inferSelect): ProjectView {
  return {
    ...row,
    stack: parseJson<string[]>(row.stack, []),
    metrics: parseJson<Metric[]>(row.metrics, []),
  };
}

export function getProjects(opts: { onlyPublished?: boolean } = {}): ProjectView[] {
  const rows = opts.onlyPublished
    ? db.select().from(projects).where(eq(projects.published, true)).orderBy(asc(projects.position)).all()
    : db.select().from(projects).orderBy(asc(projects.position)).all();
  return rows.map(toView);
}

export function getFeaturedProjects(): ProjectView[] {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.published, true), eq(projects.featured, true)))
    .orderBy(asc(projects.position))
    .all()
    .map(toView);
}

export function getProjectBySlug(slug: string): ProjectView | null {
  const row = db.select().from(projects).where(eq(projects.slug, slug)).get();
  return row ? toView(row) : null;
}

export function getProjectById(id: number): ProjectView | null {
  const row = db.select().from(projects).where(eq(projects.id, id)).get();
  return row ? toView(row) : null;
}

/** Wraps around so the last case study still offers somewhere to go. */
export function getAdjacentProject(slug: string): ProjectView | null {
  const list = getProjects({ onlyPublished: true });
  if (list.length < 2) return null;
  const i = list.findIndex((p) => p.slug === slug);
  if (i === -1) return null;
  return list[(i + 1) % list.length];
}

export type ServiceView = Omit<typeof services.$inferSelect, "features"> & { features: string[] };

export function getServices(opts: { onlyPublished?: boolean } = {}): ServiceView[] {
  const rows = opts.onlyPublished
    ? db.select().from(services).where(eq(services.published, true)).orderBy(asc(services.position)).all()
    : db.select().from(services).orderBy(asc(services.position)).all();
  return rows.map((r) => ({ ...r, features: parseJson<string[]>(r.features, []) }));
}

export function getServiceById(id: number) {
  const row = db.select().from(services).where(eq(services.id, id)).get();
  return row ? { ...row, features: parseJson<string[]>(row.features, []) } : null;
}

export function getPosts(opts: { onlyPublished?: boolean } = {}) {
  return opts.onlyPublished
    ? db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.createdAt)).all()
    : db.select().from(posts).orderBy(desc(posts.createdAt)).all();
}

export function getPostBySlug(slug: string) {
  return db.select().from(posts).where(eq(posts.slug, slug)).get() ?? null;
}

export function getPostById(id: number) {
  return db.select().from(posts).where(eq(posts.id, id)).get() ?? null;
}

export function getTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.published, true))
    .orderBy(asc(testimonials.position))
    .all();
}

export function getMessages(opts: { archived?: boolean } = {}) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.archived, opts.archived ?? false))
    .orderBy(desc(messages.createdAt))
    .all();
}

export function getUnreadCount(): number {
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.read, false), eq(messages.archived, false)))
    .all().length;
}

export type SiteSettings = Record<string, string>;

const SETTING_FALLBACKS: SiteSettings = {
  availability: "open",
  availabilityLabel: "Loyihalar uchun ochiq",
  heroEyebrow: "Sun'iy intellekt muhandisi · Toshkent",
  heroLine1: "Fikrlaydigan",
  heroLine2: "tizimlar",
  heroAccent: "quraman.",
  heroSubline: "Ovoz, xotira va real vaqt oqimlari ustida ishlaydigan mahsulotlar.",
  aboutTitle: "Men muammoni kodga emas, natijaga aylantiraman.",
  aboutBody: "",
  email: "salayevi782@gmail.com",
  telegram: "",
  github: "",
  linkedin: "",
  location: "Toshkent",
};

export function getSettings(): SiteSettings {
  const rows = db.select().from(settings).all();
  const map: SiteSettings = { ...SETTING_FALLBACKS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}
