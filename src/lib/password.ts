import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(plain, salt, KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;

  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(plain, salt, KEYLEN);
  // Both buffers are KEYLEN here, but timingSafeEqual throws on length
  // mismatch, so guard rather than let a malformed row crash the login route.
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
