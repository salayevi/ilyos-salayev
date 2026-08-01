import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { assets } from "@/db/schema";
import { getIntegrationSecret } from "@/lib/integrations";

/**
 * Captures a live site and stores the pixels in our own database.
 *
 * The rendering itself is delegated — running a headless browser would add
 * ~300 MB of dependency and a second deployment target for one button. What is
 * *not* delegated is hosting: the bytes are copied into `assets` and served
 * from `/api/shot/:id`, so the portfolio keeps rendering when the renderer
 * rate-limits, rebrands or disappears.
 *
 * Provider is swappable through `SCREENSHOT_API_URL` (a template containing
 * `{url}` for the percent-encoded target, or `{url_raw}`). The keyless default
 * is WordPress mShots, which answers immediately with a placeholder and only
 * has the real capture ready a few seconds later — hence the retry loop.
 */

const DEFAULT_ENDPOINT = "https://s.wordpress.com/mshots/v1/{url}?w=1280&h=800";

/** mShots' "still rendering" placeholder is a flat grey PNG well under this. */
const MIN_REAL_BYTES = 12_000;
/** Postgres would take more, but a portfolio thumbnail that big is a mistake. */
const MAX_BYTES = 5 * 1024 * 1024;
const ATTEMPTS = 6;
const RETRY_MS = 2_500;

export type CaptureResult = { ok: true; path: string; id: number } | { ok: false; error: string };

async function endpointFor(target: string): Promise<string> {
  const template = (await getIntegrationSecret("screenshotApiUrl")) ?? process.env.SCREENSHOT_API_URL ?? DEFAULT_ENDPOINT;
  return template
    .replaceAll("{url}", encodeURIComponent(target))
    .replaceAll("{url_raw}", target);
}

/** Only public http(s) targets: a renderer pointed at localhost sees our host. */
function validateTarget(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost")) return null;
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Captures `target` and returns the path the site should render.
 *
 * `replaces` is the previous `/api/shot/:id` value; its row is deleted once the
 * new one is safely written, so re-capturing a project does not silently grow
 * the table by a megabyte each time.
 */
export async function captureScreenshot(
  target: string,
  replaces?: string,
): Promise<CaptureResult> {
  const url = validateTarget(target);
  if (!url) {
    return { ok: false, error: "Sayt manzili noto'g'ri — https:// bilan ochiq domen kerak" };
  }

  const endpoint = await endpointFor(url.toString());
  let lastError = "Sayt suratga tushmadi";

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (attempt > 0) await wait(RETRY_MS);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
        headers: { "User-Agent": "obsidian-portfolio" },
      });
    } catch {
      lastError = "Screenshot xizmatiga ulanib bo'lmadi";
      continue;
    }

    if (!response.ok) {
      lastError = `Screenshot xizmati javobi: HTTP ${response.status}`;
      continue;
    }

    const mime = response.headers.get("content-type") ?? "image/jpeg";
    if (!mime.startsWith("image/")) {
      lastError = "Screenshot xizmati rasm qaytarmadi";
      continue;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) {
      return { ok: false, error: "Rasm juda katta (5 MB dan oshdi)" };
    }
    // Too small means the provider is still rendering, not that it failed.
    if (bytes.byteLength < MIN_REAL_BYTES) {
      lastError = "Sayt hali render bo'lmadi — birozdan keyin qayta urinib ko'ring";
      continue;
    }

    const [row] = await db
      .insert(assets)
      .values({ mime, bytes, sourceUrl: url.toString() })
      .returning({ id: assets.id });

    await dropAsset(replaces);
    return { ok: true, id: row.id, path: `/api/shot/${row.id}` };
  }

  return { ok: false, error: lastError };
}

/** Deletes the asset a `/api/shot/:id` path points at. Silent on anything else. */
export async function dropAsset(path?: string | null): Promise<void> {
  const id = assetIdFromPath(path);
  if (id === null) return;
  await db.delete(assets).where(eq(assets.id, id));
}

export function assetIdFromPath(path?: string | null): number | null {
  const match = /^\/api\/shot\/(\d+)$/.exec((path ?? "").trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
