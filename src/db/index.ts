// No `server-only` marker here on purpose: this module is also imported by the
// `db:seed` CLI script, which runs in plain Node without the react-server
// condition. The guard lives in src/lib/queries.ts instead.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

type Db = ReturnType<typeof create>;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env.local and point it at your Postgres instance.",
    );
  }
  const pool = new Pool({
    connectionString: url,
    // A portfolio site is not going to saturate Postgres; a small ceiling keeps
    // `next dev`'s module reloads from stacking up idle connections.
    max: 8,
    idleTimeoutMillis: 30_000,
    // Managed Postgres (Neon, Supabase, Vercel) terminates plain connections.
    // Local instances have no certificate, so only ask for TLS remotely.
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
  });
  return drizzle(pool, { schema });
}

// Next's dev server re-evaluates modules on every edit. Without a global cache
// each reload would open another pool and leak connections until Postgres
// starts refusing them.
const globalForDb = globalThis as unknown as { __db?: Db };

/**
 * The connection is built on first query, never at import.
 *
 * `next build` walks every route to collect page data, which imports this
 * module. Connecting eagerly meant the build demanded `DATABASE_URL` and died
 * on any machine without it — CI, a fresh clone, and Vercel, where secrets are
 * a runtime concern. A build should not need a database, and now it does not.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = (globalForDb.__db ??= create());
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
