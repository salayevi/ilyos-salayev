import "server-only";

import { randomBytes } from "node:crypto";

import { eq, gte } from "drizzle-orm";
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

  let [visitor] = await db.select().from(visitors).where(eq(visitors.token, token)).limit(1);
  if (!visitor) {
    [visitor] = await db
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
      .returning();
  } else {
    [visitor] = await db
      .update(visitors)
      .set({ lastSeenAt: now, visits: visitor.visits + 1, ...details, country, city })
      .where(eq(visitors.id, visitor.id))
      .returning();
  }

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

function tally(values: string[], limit: number) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value || "Noma'lum", (counts.get(value || "Noma'lum") ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** Admin-only callers use the past 30 days to keep the dashboard actionable. */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentVisitors = await db
    .select()
    .from(visitors)
    .where(gte(visitors.lastSeenAt, since))
    .orderBy(visitors.lastSeenAt);
  const recentEvents = await db
    .select()
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since));

  return {
    uniqueVisitors: recentVisitors.length,
    pageviews: recentEvents.filter((event) => event.type === "pageview").length,
    navigations: recentEvents.filter((event) => event.type === "navigation").length,
    devices: tally(recentVisitors.map((visitor) => visitor.device), 4),
    paths: tally(recentEvents.filter((event) => event.type === "pageview").map((event) => event.path), 6),
    recent: recentVisitors
      .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
      .slice(0, 8)
      .map(({ device, browser, os, country, city, lastSeenAt }) => ({
        device,
        browser,
        os,
        country,
        city,
        lastSeenAt,
      })),
  };
}
