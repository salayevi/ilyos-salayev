import "server-only";

import { randomBytes } from "node:crypto";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";

import { db } from "@/db";
import { analyticsEvents, visitors } from "@/db/schema";

const CONSENT_COOKIE = "obsidian_analytics";
const VISITOR_COOKIE = "obsidian_visitor";
const YEAR = 60 * 60 * 24 * 365;

export type AnalyticsEventInput = {
  type: "pageview" | "navigation";
  path: string;
  label?: string;
};

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: YEAR,
  };
}

export async function analyticsAllowed(): Promise<boolean> {
  return (await cookies()).get(CONSENT_COOKIE)?.value === "granted";
}

export async function getAnalyticsConsent(): Promise<"granted" | "denied" | null> {
  const value = (await cookies()).get(CONSENT_COOKIE)?.value;
  return value === "granted" || value === "denied" ? value : null;
}

export async function setAnalyticsConsent(allowed: boolean) {
  const jar = await cookies();
  jar.set(CONSENT_COOKIE, allowed ? "granted" : "denied", cookieOptions());
}

function deviceFrom(userAgent: string) {
  const ua = userAgent.toLowerCase();
  const device = /ipad|tablet/.test(ua) ? "tablet" : /mobi|iphone|android/.test(ua) ? "mobile" : "desktop";
  const browser = /edg\//.test(ua)
    ? "Edge"
    : /firefox\//.test(ua)
      ? "Firefox"
      : /chrome\//.test(ua)
        ? "Chrome"
        : /safari\//.test(ua)
          ? "Safari"
          : "Boshqa";
  const os = /windows/.test(ua)
    ? "Windows"
    : /mac os|macintosh/.test(ua)
      ? "macOS"
      : /android/.test(ua)
        ? "Android"
        : /iphone|ipad/.test(ua)
          ? "iOS"
          : /linux/.test(ua)
            ? "Linux"
            : "Boshqa";
  return { device, browser, os };
}

/** Ensures the submitted label cannot become a database-sized click payload. */
function clean(value: string, max: number) {
  return value.trim().slice(0, max);
}

/**
 * Records an opted-in page or navigation event. Location uses deployment
 * headers only when present; raw IP addresses are neither read nor stored.
 */
export async function recordAnalyticsEvent(input: AnalyticsEventInput): Promise<void> {
  if (!(await analyticsAllowed())) return;

  const path = clean(input.path, 240);
  if (!path.startsWith("/")) return;

  const jar = await cookies();
  let token = jar.get(VISITOR_COOKIE)?.value;
  const h = await headers();
  const details = deviceFrom(h.get("user-agent") ?? "");
  const country = clean(h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "", 80);
  const city = clean(h.get("x-vercel-ip-city") ?? "", 120);
  const now = new Date();

  if (!token) {
    token = randomBytes(24).toString("base64url");
    jar.set(VISITOR_COOKIE, token, cookieOptions());
  }

  const sessionCutoff = new Date(now.getTime() - 30 * 60_000);
  const [visitor] = await db
    .insert(visitors)
    .values({
      token,
      firstSeenAt: now,
      lastSeenAt: now,
      visits: 1,
      ...details,
      country,
      city,
    })
    .onConflictDoUpdate({
      target: visitors.token,
      set: {
        lastSeenAt: now,
        // A visit is a session, not a click. Navigation inside the same
        // 30-minute activity window updates lastSeenAt without inflating it.
        visits: sql`case when ${visitors.lastSeenAt} < ${sessionCutoff} then ${visitors.visits} + 1 else ${visitors.visits} end`,
        ...details,
        country,
        city,
      },
    })
    .returning({ id: visitors.id });

  await db.insert(analyticsEvents).values({
    visitorId: visitor.id,
    type: input.type,
    path,
    label: clean(input.label ?? "", 160),
  });
}

export type AnalyticsOverview = {
  uniqueVisitors: number;
  pageviews: number;
  navigations: number;
  devices: { label: string; count: number }[];
  paths: { label: string; count: number }[];
  recent: { device: string; browser: string; os: string; country: string; city: string; lastSeenAt: Date }[];
};

/** Admin-only callers use the past 30 days to keep the dashboard actionable. */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [visitorTotal, eventTotals, devices, paths, recent] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(visitors)
      .where(gte(visitors.lastSeenAt, since)),
    db
      .select({ type: analyticsEvents.type, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(analyticsEvents.type),
    db
      .select({ label: visitors.device, count: sql<number>`count(*)::int` })
      .from(visitors)
      .where(gte(visitors.lastSeenAt, since))
      .groupBy(visitors.device)
      .orderBy(desc(sql`count(*)`))
      .limit(4),
    db
      .select({ label: analyticsEvents.path, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.createdAt, since),
          eq(analyticsEvents.type, "pageview"),
        ),
      )
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(6),
    db
      .select({
        device: visitors.device,
        browser: visitors.browser,
        os: visitors.os,
        country: visitors.country,
        city: visitors.city,
        lastSeenAt: visitors.lastSeenAt,
      })
      .from(visitors)
      .where(gte(visitors.lastSeenAt, since))
      .orderBy(desc(visitors.lastSeenAt))
      .limit(8),
  ]);

  const totals = new Map(eventTotals.map((row) => [row.type, row.count]));

  return {
    uniqueVisitors: visitorTotal[0]?.count ?? 0,
    pageviews: totals.get("pageview") ?? 0,
    navigations: totals.get("navigation") ?? 0,
    devices: devices.map((row) => ({ label: row.label || "Noma'lum", count: row.count })),
    paths: paths.map((row) => ({ label: row.label || "Noma'lum", count: row.count })),
    recent,
  };
}
