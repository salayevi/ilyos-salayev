import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Every table carries real `timestamptz` columns rather than epoch integers. */
const stamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * Raw bytes. Drizzle ships no `bytea` helper, and the alternative — base64 in a
 * `text` column — inflates every screenshot by a third and forces a decode on
 * every read. `node-postgres` already hands back a Buffer for this type.
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  ...stamps,
});

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    category: text("category").notNull().default("SI"),
    year: text("year").notNull(),
    role: text("role").notNull().default(""),
    client: text("client").notNull().default(""),
    tone: text("tone").notNull().default("gold"),
    /** Case-study body */
    overview: text("overview").notNull().default(""),
    problem: text("problem").notNull().default(""),
    research: text("research").notNull().default(""),
    solution: text("solution").notNull().default(""),
    process: text("process").notNull().default(""),
    /** JSON string[] */
    stack: text("stack").notNull().default("[]"),
    /** JSON {value,label}[] */
    metrics: text("metrics").notNull().default("[]"),
    /** How the project was imported: `github` · `vercel` · `manual`. */
    sourceKind: text("source_kind").notNull().default("github"),
    /** Repository or Vercel project page the metadata was pulled from. */
    sourceUrl: text("source_url").notNull().default(""),
    /** The deployed site. This is the URL the screenshot is taken of. */
    liveUrl: text("live_url").notNull().default(""),
    /** Captured screenshot of the live site, as `/api/shot/<asset id>`. */
    previewImage: text("preview_image").notNull().default(""),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    position: integer("position").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ...stamps,
  },
  (t) => [uniqueIndex("projects_slug_idx").on(t.slug)],
);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  duration: text("duration").notNull().default(""),
  description: text("description").notNull().default(""),
  /** JSON string[] */
  features: text("features").notNull().default("[]"),
  /** Tariff pricing. `priceFrom` true renders as "dan boshlab". */
  price: integer("price").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  priceFrom: boolean("price_from").notNull().default(false),
  priceNote: text("price_note").notNull().default(""),
  highlighted: boolean("highlighted").notNull().default(false),
  published: boolean("published").notNull().default(true),
  position: integer("position").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ...stamps,
});

/**
 * A finished website offered for sale.
 *
 * Deliberately its own table rather than a flag on `projects`: a case study is
 * proof of work and lives forever, whereas a listing has a price, an inventory
 * state and disappears once it is sold. Overloading one row with both would put
 * a "sold" badge on the portfolio.
 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    /** Whole currency units — these are invoice figures, not fractions of a cent. */
    price: integer("price").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    priceNote: text("price_note").notNull().default(""),
    /** Live demo the buyer can click through before paying. */
    demoUrl: text("demo_url").notNull().default(""),
    sourceKind: text("source_kind").notNull().default("manual"),
    sourceUrl: text("source_url").notNull().default(""),
    previewImage: text("preview_image").notNull().default(""),
    /** JSON string[] */
    stack: text("stack").notNull().default("[]"),
    /** JSON string[] — what the buyer receives. */
    includes: text("includes").notNull().default("[]"),
    category: text("category").notNull().default("Biznes"),
    /** available · reserved · sold */
    status: text("status").notNull().default("available"),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    position: integer("position").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ...stamps,
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug)],
);

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    topic: text("topic").notNull().default(""),
    readMinutes: integer("read_minutes").notNull().default(5),
    published: boolean("published").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ...stamps,
  },
  (t) => [uniqueIndex("posts_slug_idx").on(t.slug)],
);

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  author: text("author").notNull(),
  roleLine: text("role_line").notNull().default(""),
  published: boolean("published").notNull().default(true),
  position: integer("position").notNull().default(0),
  ...stamps,
});

/**
 * An inbound enquiry, and the lead it becomes.
 *
 * This started as a three-field contact form and the table shows it. The extra
 * columns below are what a first reply actually needs to be useful: a message
 * saying "I want a website" and one saying "a store, roughly $4k, needed in six
 * weeks" deserve different answers, and asking those questions in the reply
 * costs a day per round trip.
 *
 * Everything added is optional with an empty default, so the rows written by
 * the old form stay valid and the migration is additive — no backfill, no
 * rewrite, nothing to undo if a field turns out not to earn its place.
 *
 * `status` is the pipeline. It defaults to `new`, which is exactly what every
 * existing row already is.
 */
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    body: text("body").notNull(),

    /** Qualifying detail. Blank means the sender skipped the optional block. */
    company: text("company").notNull().default(""),
    phone: text("phone").notNull().default(""),
    /** Which kind of work — matches the service categories offered on the site. */
    service: text("service").notNull().default(""),
    /**
     * dog · wolf · dragon, carried over from the plan card the visitor clicked.
     * It is the single most useful thing to know before replying, and it costs
     * the sender nothing because the choice was already made on /pricing.
     */
    tier: text("tier").notNull().default(""),
    /** A bucket, never a figure — an exact number here would be a fiction. */
    budget: text("budget").notNull().default(""),
    timeline: text("timeline").notNull().default(""),
    /** email · telegram · phone */
    preferredContact: text("preferred_contact").notNull().default(""),

    /** new · contacted · qualified · proposal · negotiation · won · lost */
    status: text("status").notNull().default("new"),
    /** Private working notes. Never shown to the sender. */
    notes: text("notes").notNull().default(""),

    read: boolean("read").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    ...stamps,
  },
  // The inbox is always read newest-first and almost always filtered by
  // pipeline state, so both get an index rather than a sequential scan that
  // grows with every enquiry ever received.
  (t) => [index("messages_created_idx").on(t.createdAt), index("messages_status_idx").on(t.status)],
);

/**
 * One inbox for both revenue streams: a booking against a service tariff and a
 * purchase request for a ready-made site. `kind` says which, and the title and
 * amount are snapshotted so an order still reads correctly after the tariff is
 * repriced or the listing is deleted.
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  /** service · product */
  kind: text("kind").notNull().default("service"),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  serviceTitle: text("service_title").notNull(),
  amount: integer("amount").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  brief: text("brief").notNull().default(""),
  preferredStart: text("preferred_start").notNull().default(""),
  /** new · contacted · scheduled · paid · done · declined */
  status: text("status").notNull().default("new"),
  /** The buyer explicitly confirmed that the prepared Telegram message was sent. */
  telegramConfirmedAt: timestamp("telegram_confirmed_at", { withTimezone: true }),
  /** Hash of the one-time public acknowledgement token; never sent back after creation. */
  customerTokenHash: text("customer_token_hash").notNull().default(""),
  ...stamps,
});

/**
 * Minimal, consent-based visitor record. It intentionally stores no IP address
 * and no browser fingerprint: the opaque cookie distinguishes a returning
 * browser without turning the portfolio into a surveillance product.
 */
export const visitors = pgTable(
  "visitors",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    visits: integer("visits").notNull().default(0),
    device: text("device").notNull().default("unknown"),
    browser: text("browser").notNull().default("unknown"),
    os: text("os").notNull().default("unknown"),
    country: text("country").notNull().default(""),
    city: text("city").notNull().default(""),
  },
  (t) => [uniqueIndex("visitors_token_idx").on(t.token), index("visitors_last_seen_idx").on(t.lastSeenAt)],
);

/** Page and outbound-navigation events attached to a consenting visitor. */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    visitorId: integer("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    path: text("path").notNull(),
    label: text("label").notNull().default(""),
    ...stamps,
  },
  (t) => [index("analytics_events_created_idx").on(t.createdAt), index("analytics_events_type_idx").on(t.type)],
);

/**
 * Secrets entered in the dashboard for integrations that require credentials.
 * The values are encrypted before storage; callers can only learn whether a
 * key has been configured, never retrieve its plaintext through the UI.
 */
export const integrationSecrets = pgTable("integration_secrets", {
  key: text("key").primaryKey(),
  encryptedValue: text("encrypted_value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Binary blobs — today only site screenshots.
 *
 * The bytes are copied into our own database rather than hot-linked from
 * whichever renderer produced them: the portfolio must keep rendering when that
 * third party rate-limits, rebrands or disappears.
 */
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  mime: text("mime").notNull().default("image/jpeg"),
  bytes: bytea("bytes").notNull(),
  /** The page that was captured, so a stale shot can be traced to its source. */
  sourceUrl: text("source_url").notNull().default(""),
  ...stamps,
});

/** Single-row key/value store for editable site copy. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Product = typeof products.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Visitor = typeof visitors.$inferSelect;
export type Admin = typeof admins.$inferSelect;
