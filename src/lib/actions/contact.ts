"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { messageSchema } from "@/lib/validators";

export type ContactState = {
  status: "idle" | "error" | "success";
  errors?: Partial<Record<"name" | "email" | "body", string>>;
  message?: string;
};

export async function submitMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = messageSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    body: formData.get("body") ?? "",
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

  db.insert(messages)
    .values({ name: parsed.data.name, email: parsed.data.email, body: parsed.data.body })
    .run();

  return { status: "success" };
}
