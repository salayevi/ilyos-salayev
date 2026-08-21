import "server-only";

/**
 * A small fixed-window limiter for the login form.
 *
 * Be clear about what this is and is not. The counters live in the process, so
 * on a serverless platform each warm instance keeps its own tally and a cold
 * start forgets everything — an attacker spread across many instances gets more
 * attempts than the number below suggests. What it does buy is the thing that
 * actually happens in practice: a single host walking a password list against
 * one endpoint gets stopped after a handful of tries instead of running for
 * hours unimpeded.
 *
 * The correct fix when the panel grows past one user is a persisted attempt
 * log keyed on identifier, which survives restarts and is shared across
 * instances. That needs a table; this needs nothing, and shipping it today is
 * strictly better than the nothing that was here before.
 */

type Window = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;

const windows = new Map<string, Window>();

/**
 * Drops expired entries so a stream of unique keys cannot grow the map without
 * bound. Runs on write rather than on a timer — a serverless instance may be
 * frozen between requests, which makes `setInterval` unreliable here anyway.
 */
function sweep(now: number) {
  if (windows.size < 512) return;
  for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
}

export type RateVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * `max` is per caller because the two callers are not the same problem. A
 * password guess is cheap to retry and expensive to get wrong, so the login
 * budget is small. A contact form is something a real person may legitimately
 * resubmit after a typo, so its budget is a little larger — the aim there is
 * to stop a script, not to punish a second attempt.
 */
export function checkRate(key: string, max = 8): RateVerdict {
  const now = Date.now();
  sweep(now);

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  return { allowed: true };
}

/** Called after a correct password, so one success does not leave the door shut. */
export function clearRate(key: string) {
  windows.delete(key);
}

/**
 * The client address as the platform reports it.
 *
 * `x-forwarded-for` is a client-settable header on a bare origin, but this app
 * is only ever reached through Vercel's proxy, which overwrites it with the
 * real peer and appends nothing an attacker controls. The leftmost entry is
 * the one to trust here for that reason — behind a different proxy this would
 * need to change.
 */
export function clientKey(headers: Headers, scope: string) {
  const forwarded = headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
