import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { db } from "@/db";
import { admins } from "@/db/schema";

const COOKIE = "ilyos_admin_session";
const LEGACY_COOKIE = "obsidian_session";
const MAX_AGE = 60 * 60 * 12;
const ISSUER = "ilyos-salayev-admin";
const AUDIENCE = "owner-dashboard";

function secret() {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. Copy .env.example to .env.local and set it.",
    );
  }
  return new TextEncoder().encode(raw);
}

type SessionIdentity = { id: number; version: number };
export type SessionPayload = SessionIdentity & { email: string; name: string };

export async function createSession(identity: SessionIdentity) {
  // Only the immutable id and revocation version enter the browser token. Name
  // and email are read from the database after verification, never copied into
  // a week-long client-side payload.
  const token = await new SignJWT({ id: identity.id, version: identity.version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" ||
      (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: MAX_AGE,
    priority: "high",
  });
  jar.delete(LEGACY_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const id = Number(payload.id);
    const version = Number(payload.version);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(version) || version <= 0) {
      return null;
    }

    // This is the secure authorization check: a deleted admin or a password
    // rotation (which increments sessionVersion) invalidates the cookie even
    // though its signature and expiry are otherwise still valid.
    const [admin] = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        version: admins.sessionVersion,
      })
      .from(admins)
      .where(and(eq(admins.id, id), eq(admins.sessionVersion, version)))
      .limit(1);
    return admin ?? null;
  } catch {
    // Expired or tampered token — treat as signed out rather than throwing.
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(LEGACY_COOKIE);
}
