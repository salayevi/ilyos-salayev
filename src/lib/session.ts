import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "obsidian_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. Copy .env.example to .env.local and set it.",
    );
  }
  return new TextEncoder().encode(raw);
}

export type SessionPayload = { id: number; email: string; name: string };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Keyed off the deploy URL rather than NODE_ENV: a production build served
    // over plain HTTP (local `next start`, a LAN box) would never receive a
    // Secure cookie, so login would silently fail.
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: Number(payload.id), email: String(payload.email), name: String(payload.name) };
  } catch {
    // Expired or tampered token — treat as signed out rather than throwing.
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
