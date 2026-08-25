import "server-only";

import { and, asc, count, desc, eq, inArray, isNull, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  estimates,
  messages,
  orders,
  posts,
  pricingGroups,
  pricingOptions,
  products,
  projects,
  serviceCatalog,
  services,
  settings,
  testimonials,
} from "@/db/schema";
import { OPEN_ORDER_STATUSES } from "./inventory";
import type { Line, PriceGroup, PriceOption } from "./pricing/engine";
import { type Metric, parseJson } from "./validators";


/**
 * Reads that survive an unreachable database.
 *
 * Every public page queries on each request, so a database that is down, still
 * booting, or pointed at the wrong host took the whole site with it — the
 * visitor got a bare "server error" instead of a portfolio. A read failure now
 * degrades to an empty result and the page renders its own empty state.
 *
 * Deliberately reads only. Writes must still throw: silently dropping an order
 * or a contact message would be far worse than an error the owner can see.
 */
async function safeRead<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[db] ${label} o'qib bo'lmadi:`, error);
    return fallback;
  }
}

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
  return safeRead("projects", async () => {
    const base = db.select().from(projects).$dynamic();
    const rows = await (opts.onlyPublished
      ? base.where(eq(projects.published, true))
      : base
    ).orderBy(asc(projects.position));
    return rows.map(toView);
  }, []);
}

export async function getFeaturedProjects(): Promise<ProjectView[]> {
  return safeRead("featured projects", async () => {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.published, true), eq(projects.featured, true)))
      .orderBy(asc(projects.position));
    return rows.map(toView);
  }, []);
}

export async function getProjectBySlug(slug: string): Promise<ProjectView | null> {
  return safeRead(
    `project ${slug}`,
    async () => {
      const [row] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
      return row ? toView(row) : null;
    },
    null,
  );
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
  return safeRead("services", async () => {
    const base = db.select().from(services).$dynamic();
    const rows = await (opts.onlyPublished
      ? base.where(eq(services.published, true))
      : base
    ).orderBy(asc(services.position));
    return rows.map(toServiceView);
  }, []);
}

export async function getServiceById(id: number): Promise<ServiceView | null> {
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return row ? toServiceView(row) : null;
}

export type ProductView = Omit<typeof products.$inferSelect, "stack" | "includes"> & {
  stack: string[];
  includes: string[];
};

function toProductView(row: typeof products.$inferSelect): ProductView {
  return {
    ...row,
    stack: parseJson<string[]>(row.stack, []),
    includes: parseJson<string[]>(row.includes, []),
  };
}

/**
 * Puts lapsed holds back on the shelf.
 *
 * Called from the reads that display listings rather than from a scheduler:
 * this deployment has no cron, and a reservation only matters at the moment
 * someone is looking at the thing it blocks. `sold` is never touched — that is
 * a terminal state and no timer may undo it.
 *
 * A failure here is logged and swallowed. Not releasing a stale hold shows one
 * listing as unavailable for a while; throwing would take the whole shop page
 * down instead.
 */
export async function releaseExpiredReservations(): Promise<number> {
  try {
    return await db.transaction(async (tx) => {
      const now = new Date();
      const expired = await tx
        .select({ id: products.id, reservationKey: products.reservationKey })
        .from(products)
        .where(and(eq(products.status, "reserved"), lte(products.reservedUntil, now)))
        // Multiple public renders may run the sweep together. Each row belongs
        // to one sweeper; the rest skip it rather than waiting on the lock.
        .for("update", { skipLocked: true });

      for (const item of expired) {
        const ownership = item.reservationKey
          ? eq(orders.reservationKey, item.reservationKey)
          : isNull(orders.reservationKey);
        await tx
          .update(orders)
          .set({ status: "expired" })
          .where(
            and(
              eq(orders.kind, "product"),
              eq(orders.productId, item.id),
              ownership,
              inArray(orders.status, [...OPEN_ORDER_STATUSES]),
            ),
          );
        await tx
          .update(products)
          .set({
            status: "available",
            reservedUntil: null,
            reservationKey: null,
            updatedAt: now,
          })
          .where(and(eq(products.id, item.id), eq(products.status, "reserved")));
      }

      return expired.length;
    });
  } catch (error) {
    console.error("[inventory] eskirgan rezervni bo'shatib bo'lmadi:", error);
    return 0;
  }
}

export async function getProducts(opts: { onlyPublished?: boolean } = {}): Promise<ProductView[]> {
  // Sweep before reading, so a listing whose hold lapsed a minute ago is on
  // sale in the same render rather than the next one.
  await releaseExpiredReservations();
  return safeRead("products", async () => {
    const base = db.select().from(products).$dynamic();
    const rows = await (opts.onlyPublished
      ? base.where(eq(products.published, true))
      : base
    ).orderBy(asc(products.position), desc(products.createdAt));
    return rows.map(toProductView);
  }, []);
}

export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  await releaseExpiredReservations();
  return safeRead(
    `product ${slug}`,
    async () => {
      const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
      return row ? toProductView(row) : null;
    },
    null,
  );
}

export async function getProductById(id: number): Promise<ProductView | null> {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ? toProductView(row) : null;
}

export async function getPosts(opts: { onlyPublished?: boolean } = {}) {
  return safeRead("posts", async () => {
    const base = db.select().from(posts).$dynamic();
    return (opts.onlyPublished ? base.where(eq(posts.published, true)) : base).orderBy(
      desc(posts.createdAt),
    );
  }, [] as (typeof posts.$inferSelect)[]);
}

export async function getPostBySlug(slug: string) {
  return safeRead(
    `post ${slug}`,
    async () => {
      const [row] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
      return row ?? null;
    },
    null,
  );
}

export async function getPostById(id: number) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function getTestimonials() {
  return safeRead(
    "testimonials",
    () =>
      db
        .select()
        .from(testimonials)
        .where(eq(testimonials.published, true))
        .orderBy(asc(testimonials.position)),
    [] as (typeof testimonials.$inferSelect)[],
  );
}

export async function getMessages(opts: { archived?: boolean } = {}) {
  return safeRead(
    "messages",
    () =>
      db
        .select()
        .from(messages)
        .where(eq(messages.archived, opts.archived ?? false))
        .orderBy(desc(messages.createdAt)),
    [] as (typeof messages.$inferSelect)[],
  );
}

export async function getUnreadCount(): Promise<number> {
  return safeRead("unread count", async () => {
  const [row] = await db
    .select({ n: count() })
    .from(messages)
    .where(and(eq(messages.read, false), eq(messages.archived, false)));
  return row?.n ?? 0;
  }, 0);
}

export async function getOrders(opts: { status?: string } = {}) {
  const base = db.select().from(orders).$dynamic();
  return (opts.status ? base.where(eq(orders.status, opts.status)) : base).orderBy(
    desc(orders.createdAt),
  );
}

export async function getNewOrderCount(): Promise<number> {
  return safeRead(
    "new order count",
    async () => {
      const [row] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "new"));
      return row?.n ?? 0;
    },
    0,
  );
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
  // Whole USD. The plan *structure* is code, but the two starting figures move
  // with the market, so they are editable from the panel without a deploy.
  planDogPrice: "500",
  planWolfPrice: "1500",
};

export async function getSettings(): Promise<SiteSettings> {
  // The fallbacks exist precisely so the site can introduce itself without a
  // database — the hero, the nav and the footer all read from here.
  return safeRead(
    "settings",
    async () => {
      const rows = await db.select().from(settings);
      const map: SiteSettings = { ...SETTING_FALLBACKS };
      for (const row of rows) map[row.key] = row.value;
      return map;
    },
    { ...SETTING_FALLBACKS },
  );
}

/* ---------------------------------------------------------------- pricing */

export type CatalogView = Omit<
  typeof serviceCatalog.$inferSelect,
  "includes" | "groups"
> & { includes: string[]; groups: string[] };

function toCatalogView(row: typeof serviceCatalog.$inferSelect): CatalogView {
  return {
    ...row,
    includes: parseJson<string[]>(row.includes, []),
    groups: parseJson<string[]>(row.groups, []),
  };
}

export async function getCatalog(opts: { onlyPublished?: boolean } = {}): Promise<CatalogView[]> {
  return safeRead(
    "service catalog",
    async () => {
      const base = db.select().from(serviceCatalog).$dynamic();
      const rows = await (opts.onlyPublished
        ? base.where(eq(serviceCatalog.published, true))
        : base
      ).orderBy(asc(serviceCatalog.position));
      return rows.map(toCatalogView);
    },
    [],
  );
}

export async function getCatalogService(slug: string): Promise<CatalogView | null> {
  return safeRead(
    `catalog ${slug}`,
    async () => {
      const [row] = await db
        .select()
        .from(serviceCatalog)
        .where(eq(serviceCatalog.slug, slug))
        .limit(1);
      return row ? toCatalogView(row) : null;
    },
    null,
  );
}

/**
 * The configurator's whole vocabulary in one read.
 *
 * Returned as the engine's own types so the same values can be handed to a
 * client component and fed straight back into `calculate` there — the browser
 * prices a change without a round trip, and the server recomputes from these
 * same rows when the estimate is saved. Two callers, one shape, no drift.
 */
export type PricingConfig = { groups: PriceGroup[]; options: PriceOption[] };

export async function getPricingConfig(): Promise<PricingConfig> {
  return safeRead(
    "pricing config",
    async () => {
      const [groupRows, optionRows] = await Promise.all([
        db
          .select()
          .from(pricingGroups)
          .where(eq(pricingGroups.active, true))
          .orderBy(asc(pricingGroups.position)),
        db
          .select()
          .from(pricingOptions)
          .where(eq(pricingOptions.active, true))
          .orderBy(asc(pricingOptions.position)),
      ]);

      return {
        groups: groupRows.map((g) => ({
          key: g.key,
          label: g.label,
          help: g.help,
          select: g.select === "many" ? ("many" as const) : ("one" as const),
          required: g.required,
        })),
        options: optionRows.map((o) => ({
          groupKey: o.groupKey,
          key: o.key,
          label: o.label,
          description: o.description,
          mode: o.mode === "multiplier" ? ("multiplier" as const) : ("flat" as const),
          amount: o.amount,
          monthly: o.monthly,
          externalMin: o.externalMin,
          externalMax: o.externalMax,
          weeks: o.weeks,
          weeksFactor: o.weeksFactor,
          requires: parseJson<string[]>(o.requires, []),
          conflicts: parseJson<string[]>(o.conflicts, []),
          needsReview: o.needsReview,
        })),
      };
    },
    { groups: [], options: [] },
  );
}

export type EstimateView = Omit<typeof estimates.$inferSelect, "selections" | "breakdown"> & {
  selections: Record<string, string | string[]>;
  breakdown: Line[];
};

/**
 * Reads a saved estimate by its public reference.
 *
 * The stored figures are returned as written, never recomputed. A quote shown
 * on Tuesday has to still say the same thing on Friday even if a feature was
 * repriced on Wednesday — the selections are kept alongside so a stale one can
 * be re-run deliberately, and the difference explained rather than applied
 * behind someone's back.
 */
export async function getEstimate(publicId: string): Promise<EstimateView | null> {
  return safeRead(
    `estimate ${publicId}`,
    async () => {
      const [row] = await db
        .select()
        .from(estimates)
        .where(eq(estimates.publicId, publicId))
        .limit(1);
      if (!row) return null;
      return {
        ...row,
        selections: parseJson<Record<string, string | string[]>>(row.selections, {}),
        breakdown: parseJson<Line[]>(row.breakdown, []),
      };
    },
    null,
  );
}

/**
 * The raw pricing rows, for the panel.
 *
 * Deliberately not `getPricingConfig`. That one returns the engine's shape —
 * no row ids, inactive options already filtered out — which is exactly right
 * for pricing a project and exactly wrong for editing one: the panel needs the
 * id to write back, and needs to see a switched-off option in order to switch
 * it on again.
 */
export async function getPricingRows() {
  return safeRead(
    "pricing rows",
    async () => {
      const [groupRows, optionRows] = await Promise.all([
        db.select().from(pricingGroups).orderBy(asc(pricingGroups.position)),
        db.select().from(pricingOptions).orderBy(asc(pricingOptions.position)),
      ]);
      return { groups: groupRows, options: optionRows };
    },
    { groups: [] as (typeof pricingGroups.$inferSelect)[], options: [] as (typeof pricingOptions.$inferSelect)[] },
  );
}

export const ESTIMATE_STAGES = [
  { value: "submitted", label: "Yuborilgan", tone: "info" },
  { value: "reviewing", label: "Ko'rib chiqilmoqda", tone: "neutral" },
  { value: "quoted", label: "Taklif berildi", tone: "warn" },
  { value: "accepted", label: "Qabul qilindi", tone: "ok" },
  { value: "declined", label: "Rad etildi", tone: "bad" },
  { value: "draft", label: "Yuborilmagan", tone: "neutral" },
] as const;

/**
 * Estimates for the panel, newest first.
 *
 * Drafts are included but sort last. Someone who configured a project and left
 * without sending it is not a lead, but the shape of what they were pricing is
 * the most honest signal there is about what the catalogue is being asked for.
 */
export async function getEstimates(): Promise<EstimateView[]> {
  return safeRead(
    "estimates",
    async () => {
      const rows = await db.select().from(estimates).orderBy(desc(estimates.createdAt));
      return rows
        .map((row) => ({
          ...row,
          selections: parseJson<Record<string, string | string[]>>(row.selections, {}),
          breakdown: parseJson<Line[]>(row.breakdown, []),
        }))
        .sort((a, b) => Number(a.status === "draft") - Number(b.status === "draft"));
    },
    [],
  );
}

/** Unsent drafts do not count — the badge is for work waiting on a reply. */
export async function getNewEstimateCount(): Promise<number> {
  return safeRead(
    "new estimate count",
    async () => {
      const [row] = await db
        .select({ n: count() })
        .from(estimates)
        .where(eq(estimates.status, "submitted"));
      return row?.n ?? 0;
    },
    0,
  );
}
