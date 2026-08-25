import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * A fixed-window limiter backed by the database.
 *
 * The first version of this kept counters in process memory. On a serverless
 * platform that means every warm instance counts separately and a cold start
 * forgets everything, so the real budget was some unknown multiple of the
 * number written in the code — which is the same as not having a limit, only
 * harder to notice.
 *
 * One row per key, one statement per check. The upsert below is the whole
 * mechanism: Postgres serialises concurrent writes to the same primary key, so
 * two requests arriving in the same millisecond cannot both read a stale count
 * and both decide they are under the limit.
 */

const WINDOW_MS = 15 * 60 * 1000;

export type RateVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * `max` is per caller because the callers are not the same problem. A password
 * guess is cheap to retry and expensive to get wrong, so the login budget is
 * small. A contact form is something a real person may legitimately resubmit
 * after a typo, so its budget is larger — the aim there is to stop a script,
 * not to punish a second attempt.
 *
 * A database that is unreachable returns `allowed`. Refusing every request
 * because the counter cannot be read would turn a degraded database into a
 * total outage, and the limiter is a mitigation rather than the security
 * boundary — the password check behind it still has to pass either way.
 */
export async function checkRate(key: string, max = 8): Promise<RateVerdict> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + WINDOW_MS);

  try {
    /*
      Increment inside the conflict branch rather than reading first: the read
      and the write would be two statements with a gap between them, and the
      gap is exactly where a burst slips through. `excluded.reset_at` is the
      value this call proposed, so a lapsed window restarts at 1 and a live one
      keeps its own deadline.
    */
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
          resetAt: sql`case when ${rateLimits.resetAt} <= now() then excluded.reset_at else ${rateLimits.resetAt} end`,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

    if (!row || row.count <= max) return { allowed: true };
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)),
    };
  } catch (error) {
    console.error("[rate-limit] hisoblagichga yozib bo'lmadi:", error);
    return { allowed: true };
  }
}

/** Called after a correct password, so one success does not leave the door shut. */
export async function clearRate(key: string) {
  try {
    await db.delete(rateLimits).where(sql`${rateLimits.key} = ${key}`);
  } catch (error) {
    console.error("[rate-limit] hisoblagichni tozalab bo'lmadi:", error);
  }
}

/**
 * Drops lapsed rows so the table cannot grow with every unique key ever seen.
 *
 * Called opportunistically from the panel rather than on a schedule: there is
 * no scheduler in this deployment, and a few hundred stale rows cost nothing
 * until someone happens to look.
 */
export async function sweepRateLimits() {
  try {
    const deleted = await db
      .delete(rateLimits)
      .where(sql`${rateLimits.resetAt} <= now() - interval '1 hour'`)
      .returning({ key: rateLimits.key });
    return deleted.length;
  } catch {
    return 0;
  }
}

/**
 * The client address as the platform reports it.
 *
 * `x-forwarded-for` is a client-settable header on a bare origin, but this app
 * is only ever reached through Vercel's proxy, which overwrites it with the
 * real peer. The leftmost entry is the one to trust for that reason — behind a
 * different proxy this would need to change.
 */
export function clientKey(headers: Headers, scope: string) {
  const forwarded = headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
