// No `server-only` marker here on purpose: this module is also imported by the
// `db:seed` CLI script, which runs in plain Node without the react-server
// condition. The guard lives in src/lib/queries.ts instead.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

function connectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env.local and point it at your Postgres instance.",
    );
  }
  return url;
}

function create() {
  const pool = new Pool({
    connectionString: connectionString(),
    // A portfolio site is not going to saturate Postgres; a small ceiling keeps
    // `next dev`'s module reloads from stacking up idle connections.
    max: 8,
    idleTimeoutMillis: 30_000,
  });
  return drizzle(pool, { schema });
}

// Next's dev server re-evaluates modules on every edit. Without a global cache
// each reload would open another pool and leak connections until Postgres
// starts refusing them.
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof create> };

export const db = globalForDb.__db ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export { schema };
