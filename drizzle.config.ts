import type { Config } from "drizzle-kit";

// No inline fallback: the URL carries a password, and a default here would end
// up committed. drizzle-kit loads .env.local via the npm script.
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;
