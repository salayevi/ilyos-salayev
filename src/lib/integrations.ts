import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { integrationSecrets } from "@/db/schema";

export const INTEGRATION_KEYS = ["githubToken", "vercelToken", "screenshotApiUrl"] as const;
export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];
export type IntegrationStatus = "empty" | "stored" | "legacy" | "invalid" | "environment";

const ENVIRONMENT_KEYS: Record<IntegrationKey, string | undefined> = {
  githubToken: process.env.GITHUB_TOKEN,
  vercelToken: process.env.VERCEL_TOKEN,
  screenshotApiUrl: process.env.SCREENSHOT_API_URL,
};

function keyMaterial(version: "v1" | "v2") {
  const variable = version === "v2" ? "APP_MASTER_KEY" : "SESSION_SECRET";
  const secret = process.env[variable];
  if (!secret || secret.length < 32) {
    throw new Error(`${variable} kamida 32 belgidan iborat bo'lishi kerak`);
  }
  return createHash("sha256")
    .update(`${version === "v2" ? "ilyos-integrations" : "obsidian-integrations"}:${secret}`)
    .digest();
}

/** AES-256-GCM: a database dump alone cannot reveal dashboard-entered keys. */
export function encryptIntegrationSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial("v2"), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v2.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptIntegrationSecret(value: string): { value: string; version: "v1" | "v2" } | null {
  const [version, ivRaw, tagRaw, dataRaw] = value.split(".");
  if ((version !== "v1" && version !== "v2") || !ivRaw || !tagRaw || !dataRaw) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      keyMaterial(version),
      Buffer.from(ivRaw, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataRaw, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return plain ? { value: plain, version } : null;
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
  return row ? (decryptIntegrationSecret(row.encryptedValue)?.value ?? null) : null;
}

export async function getIntegrationStatus() {
  const rows = await db
    .select({ key: integrationSecrets.key, encryptedValue: integrationSecrets.encryptedValue })
    .from(integrationSecrets);
  const configured = new Map(rows.map((row) => [row.key, row.encryptedValue]));

  return Object.fromEntries(
    INTEGRATION_KEYS.map((key) => {
      const encrypted = configured.get(key);
      if (!encrypted) return [key, ENVIRONMENT_KEYS[key] ? "environment" : "empty"];
      const secret = decryptIntegrationSecret(encrypted);
      if (!secret) return [key, "invalid"];
      return [key, secret.version === "v1" ? "legacy" : "stored"];
    }),
  ) as Record<IntegrationKey, IntegrationStatus>;
}
