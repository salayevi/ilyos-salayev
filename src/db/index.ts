// No `server-only` marker here on purpose: this module is also imported by the
// `db:seed` CLI script, which runs in plain Node without the react-server
// condition. The guard lives in src/lib/queries.ts instead.
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schema";

const DB_PATH = resolve(process.cwd(), process.env.DATABASE_URL ?? "./data/portfolio.db");

function create() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const instance = drizzle(sqlite, { schema });
  // Migrations are cheap and idempotent; running them on first import keeps
  // `npm run dev` working from a clean checkout with no extra setup step.
  migrate(instance, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  return instance;
}

// Next's dev server re-evaluates modules on every edit. Without a global cache
// each reload would open another handle to the same file and leak descriptors.
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof create> };

export const db = globalForDb.__db ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export { schema };
