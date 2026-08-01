import { eq } from "drizzle-orm";

import { db } from "@/db";
import { assets } from "@/db/schema";

/**
 * Serves a captured screenshot out of the database.
 *
 * Rows are immutable — re-capturing writes a new row and repoints the project —
 * so the response is safe to cache forever. That immutability is what lets a
 * database-backed image behave like a static file at the CDN.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = Number(id);
  if (!Number.isSafeInteger(key) || key <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const [row] = await db
    .select({ mime: assets.mime, bytes: assets.bytes })
    .from(assets)
    .where(eq(assets.id, key))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
