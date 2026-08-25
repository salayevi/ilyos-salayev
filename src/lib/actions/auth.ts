"use server";

import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRate, clearRate, clientKey } from "@/lib/rate-limit";
import { createSession, destroySession, readSession } from "@/lib/session";
import { changePasswordSchema, loginSchema } from "@/lib/validators";

export type LoginState = { error?: string };
export type ChangePasswordState = {
  error?: string;
  fieldErrors?: Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;
};

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
  await createSession({ id: admin.id, version: admin.sessionVersion });
  redirect("/admin");
}

export async function changeAdminPassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await readSession();
  if (!session) redirect("/admin/login");

  const verdict = await checkRate(clientKey(await headers(), `password-change-${session.id}`), 5);
  if (!verdict.allowed) return { error: "Juda ko'p urinish. Birozdan keyin qayta urining." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: NonNullable<ChangePasswordState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "currentPassword" ||
        field === "newPassword" ||
        field === "confirmPassword"
      ) {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { error: "Parol talablarini tekshiring", fieldErrors };
  }

  const [admin] = await db.select().from(admins).where(eq(admins.id, session.id)).limit(1);
  if (!admin || !verifyPassword(parsed.data.currentPassword, admin.passwordHash)) {
    return {
      error: "Amaldagi parol noto'g'ri",
      fieldErrors: { currentPassword: "Amaldagi parol noto'g'ri" },
    };
  }

  const [updated] = await db
    .update(admins)
    .set({
      passwordHash: hashPassword(parsed.data.newPassword),
      sessionVersion: sql`${admins.sessionVersion} + 1`,
    })
    .where(and(eq(admins.id, session.id), eq(admins.sessionVersion, session.version)))
    .returning({ id: admins.id });
  if (!updated) return { error: "Sessiya o'zgargan. Qayta kirib urinib ko'ring." };

  await clearRate(clientKey(await headers(), `password-change-${session.id}`));
  await destroySession();
  redirect("/admin/login?changed=1");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
