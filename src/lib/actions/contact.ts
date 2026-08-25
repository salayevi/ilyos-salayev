"use server";

import { headers } from "next/headers";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { checkRate, clientKey } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/validators";

/** Only the three required fields can carry an error the form can point at. */
type FieldError = "name" | "email" | "body";

export type ContactState = {
  status: "idle" | "error" | "success";
  errors?: Partial<Record<FieldError, string>>;
  message?: string;
};

export async function submitMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // The honeypot stops the crude bots; this stops the one that found the
  // action endpoint and posts to it directly. Ten enquiries in fifteen minutes is far
  // more than a real person sends and far less than a script wants.
  const rate = await checkRate(clientKey(await headers(), "contact"), 10);
  if (!rate.allowed) {
    return {
      status: "error",
      message: "Juda ko'p so'rov yuborildi. Biroz kutib, qayta urinib ko'ring.",
    };
  }

  const parsed = messageSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    body: formData.get("body") ?? "",
    company: formData.get("company") ?? "",
    phone: formData.get("phone") ?? "",
    service: formData.get("service") ?? "",
    tier: formData.get("tier") ?? "",
    budget: formData.get("budget") ?? "",
    timeline: formData.get("timeline") ?? "",
    preferredContact: formData.get("preferredContact") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const errors: NonNullable<ContactState["errors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      // The honeypot has no visible field to attach an error to, so a bot that
      // fills it gets the same generic failure a malformed form would get.
      if (field === "name" || field === "email" || field === "body") {
        errors[field] ??= issue.message;
      }
    }
    return {
      status: "error",
      errors,
      message: Object.keys(errors).length ? undefined : "Xabar yuborilmadi. Qayta urinib ko'ring.",
    };
  }

  const d = parsed.data;
  await db.insert(messages).values({
    name: d.name,
    email: d.email,
    body: d.body,
    company: d.company,
    phone: d.phone,
    service: d.service,
    tier: d.tier,
    budget: d.budget,
    timeline: d.timeline,
    preferredContact: d.preferredContact,
  });

  return { status: "success" };
}
