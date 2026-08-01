import {
  boolean,
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
    /** How the project was submitted, and the source it was submitted from. */
    sourceKind: text("source_kind").notNull().default("github"),
    sourceUrl: text("source_url").notNull().default(""),
    /** Captured screenshot of the live site's homepage. */
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

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  ...stamps,
});

/** A booking placed against a service tariff. */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
  serviceTitle: text("service_title").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  brief: text("brief").notNull().default(""),
  preferredStart: text("preferred_start").notNull().default(""),
  /** new · contacted · scheduled · done · declined */
  status: text("status").notNull().default("new"),
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
export type Service = typeof services.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Admin = typeof admins.$inferSelect;
