import { eq } from "drizzle-orm";

import { db } from "@/db";
import { assets } from "@/db/schema";
import { detectRasterMime } from "@/lib/image-security";

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
    .select({ bytes: assets.bytes })
    .from(assets)
    .where(eq(assets.id, key))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  // Historical rows are checked too. A mislabeled SVG must not become active
  // same-origin content merely because it predates upload validation.
  const mime = detectRasterMime(row.bytes);
  if (!mime) return new Response("Unsupported image", { status: 415 });

  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(row.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="screenshot-${key}.${mime.split("/")[1]}"`,
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
