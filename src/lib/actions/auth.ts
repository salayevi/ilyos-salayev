"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { checkRate, clearRate, clientKey } from "@/lib/rate-limit";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const key = clientKey(await headers(), "login");

  // Counted before the password is checked, so a guess costs an attempt whether
  // or not it was close. Checking after would let an attacker probe for free by
  // sending malformed input.
  const verdict = await checkRate(key, 6);
  if (!verdict.allowed) {
    const minutes = Math.ceil(verdict.retryAfterSeconds / 60);
    return { error: `Juda ko'p urinish. ${minutes} daqiqadan keyin qayta urining.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });

  // A wrong email and a wrong password return the same message on purpose —
  // telling them apart would let anyone enumerate valid accounts.
  const generic = { error: "Email yoki parol noto'g'ri" };
  if (!parsed.success) return generic;

  const [admin] = await db.select().from(admins).where(eq(admins.email, parsed.data.email)).limit(1);
  if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) return generic;

  await clearRate(key);
  await createSession({ id: admin.id, email: admin.email, name: admin.name });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
