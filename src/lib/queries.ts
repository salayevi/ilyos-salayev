import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { messages, orders, posts, projects, services, settings, testimonials } from "@/db/schema";
import { type Metric, parseJson } from "./validators";

export type ProjectView = Omit<typeof projects.$inferSelect, "stack" | "metrics"> & {
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

export async function getProjects(opts: { onlyPublished?: boolean } = {}): Promise<ProjectView[]> {
  const base = db.select().from(projects).$dynamic();
  const rows = await (opts.onlyPublished ? base.where(eq(projects.published, true)) : base).orderBy(
    asc(projects.position),
  );
  return rows.map(toView);
}

export async function getFeaturedProjects(): Promise<ProjectView[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.published, true), eq(projects.featured, true)))
    .orderBy(asc(projects.position));
  return rows.map(toView);
}

export async function getProjectBySlug(slug: string): Promise<ProjectView | null> {
  const [row] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  return row ? toView(row) : null;
}

export async function getProjectById(id: number): Promise<ProjectView | null> {
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return row ? toView(row) : null;
}

/** Wraps around so the last case study still offers somewhere to go. */
export async function getAdjacentProject(slug: string): Promise<ProjectView | null> {
  const list = await getProjects({ onlyPublished: true });
  if (list.length < 2) return null;
  const i = list.findIndex((p) => p.slug === slug);
  if (i === -1) return null;
  return list[(i + 1) % list.length];
}

export type ServiceView = Omit<typeof services.$inferSelect, "features"> & { features: string[] };

function toServiceView(row: typeof services.$inferSelect): ServiceView {
  return { ...row, features: parseJson<string[]>(row.features, []) };
}

export async function getServices(opts: { onlyPublished?: boolean } = {}): Promise<ServiceView[]> {
  const base = db.select().from(services).$dynamic();
  const rows = await (opts.onlyPublished ? base.where(eq(services.published, true)) : base).orderBy(
    asc(services.position),
  );
  return rows.map(toServiceView);
}

export async function getServiceById(id: number): Promise<ServiceView | null> {
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return row ? toServiceView(row) : null;
}

export async function getPosts(opts: { onlyPublished?: boolean } = {}) {
  const base = db.select().from(posts).$dynamic();
  return (opts.onlyPublished ? base.where(eq(posts.published, true)) : base).orderBy(
    desc(posts.createdAt),
  );
}

export async function getPostBySlug(slug: string) {
  const [row] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return row ?? null;
}

export async function getPostById(id: number) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function getTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.published, true))
    .orderBy(asc(testimonials.position));
}

export async function getMessages(opts: { archived?: boolean } = {}) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.archived, opts.archived ?? false))
    .orderBy(desc(messages.createdAt));
}

export async function getUnreadCount(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(messages)
    .where(and(eq(messages.read, false), eq(messages.archived, false)));
  return row?.n ?? 0;
}

export async function getOrders(opts: { status?: string } = {}) {
  const base = db.select().from(orders).$dynamic();
  return (opts.status ? base.where(eq(orders.status, opts.status)) : base).orderBy(
    desc(orders.createdAt),
  );
}

export async function getNewOrderCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "new"));
  return row?.n ?? 0;
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

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings);
  const map: SiteSettings = { ...SETTING_FALLBACKS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}
