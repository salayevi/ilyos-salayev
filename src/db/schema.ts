import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch())`;

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at").notNull().default(now),
});

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at").notNull().default(now),
    updatedAt: integer("updated_at").notNull().default(now),
  },
  (t) => [uniqueIndex("projects_slug_idx").on(t.slug)],
);

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  duration: text("duration").notNull().default(""),
  description: text("description").notNull().default(""),
  /** JSON string[] */
  features: text("features").notNull().default("[]"),
  priceNote: text("price_note").notNull().default(""),
  highlighted: integer("highlighted", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at").notNull().default(now),
  updatedAt: integer("updated_at").notNull().default(now),
});

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    topic: text("topic").notNull().default(""),
    readMinutes: integer("read_minutes").notNull().default(5),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull().default(now),
    updatedAt: integer("updated_at").notNull().default(now),
  },
  (t) => [uniqueIndex("posts_slug_idx").on(t.slug)],
);

export const testimonials = sqliteTable("testimonials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quote: text("quote").notNull(),
  author: text("author").notNull(),
  roleLine: text("role_line").notNull().default(""),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at").notNull().default(now),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull().default(now),
});

/** Single-row key/value store for editable site copy. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: integer("updated_at").notNull().default(now),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Service = typeof services.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Admin = typeof admins.$inferSelect;
