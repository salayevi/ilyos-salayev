import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { integrationSecrets } from "@/db/schema";

export const INTEGRATION_KEYS = ["githubToken", "vercelToken", "screenshotApiUrl"] as const;
export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

function keyMaterial() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET is not configured");
  return createHash("sha256").update(`obsidian-integrations:${secret}`).digest();
}

/** AES-256-GCM: a database dump alone cannot reveal dashboard-entered keys. */
export function encryptIntegrationSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptIntegrationSecret(value: string) {
  const [version, ivRaw, tagRaw, dataRaw] = value.split(".");
  if (version !== "v1" || !ivRaw || !tagRaw || !dataRaw) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyMaterial(), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export async function getIntegrationSecret(key: IntegrationKey): Promise<string | null> {
  const [row] = await db
    .select({ encryptedValue: integrationSecrets.encryptedValue })
    .from(integrationSecrets)
    .where(eq(integrationSecrets.key, key))
    .limit(1);
  return row ? decryptIntegrationSecret(row.encryptedValue) : null;
}

export async function getIntegrationStatus() {
  const rows = await db.select({ key: integrationSecrets.key }).from(integrationSecrets);
  const configured = new Set(rows.map((row) => row.key));
  return Object.fromEntries(INTEGRATION_KEYS.map((key) => [key, configured.has(key)])) as Record<
    IntegrationKey,
    boolean
  >;
}
