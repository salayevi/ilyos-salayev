"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { messages, posts, projects, services, settings } from "@/db/schema";
import { readSession } from "@/lib/session";
import { postSchema, projectSchema, serviceSchema, settingsSchema } from "@/lib/validators";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireAdmin() {
  const session = await readSession();
  // Every mutation re-checks the cookie. The layout guard is for navigation;
  // it is not a security boundary on its own, because actions are addressable.
  if (!session) redirect("/admin/login");
  return session;
}

function collect(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key) fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/**
 * Reads the row id out of the form.
 *
 * The id travels as a hidden field rather than via `action.bind(null, id)`:
 * a bound Server Action driven by `useActionState` never finishes streaming
 * its reply in Next 16.2 — the write lands but the response hangs, so the UI
 * spins forever. Unbound `(prevState, formData)` actions are unaffected.
 */
function rowId(formData: FormData): number | null {
  const raw = String(formData.get("id") ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Every page is `force-dynamic`, so it already re-reads the database on each
 * request — the only stale copy is the client-side Router Cache.
 *
 * This deliberately does NOT use `revalidatePath("/", "layout")`. Invalidating
 * the root layout makes Next re-render the whole dynamic tree to build the
 * action's response, and those renders hit better-sqlite3 synchronously from
 * inside the action's own render pass, which deadlocks the response stream:
 * the write lands but the reply never arrives. Narrow page-level invalidation
 * keeps the router honest without that blast radius.
 */
function refreshPublic(extra?: string) {
  revalidatePath("/", "page");
  if (extra) revalidatePath(extra, "page");
}

// ----------------------------------------------------------------- projects

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = rowId(formData);

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = projectSchema.safeParse({
    ...raw,
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const d = parsed.data;
  const values = {
    ...d,
    stack: JSON.stringify(d.stack),
    metrics: JSON.stringify(d.metrics),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  // Slug is unique; surface the collision instead of letting SQLite throw.
  const clash = db.select().from(projects).where(eq(projects.slug, d.slug)).get();
  if (clash && clash.id !== id) {
    return { error: "Bu slug band", fieldErrors: { slug: "Bu slug allaqachon ishlatilgan" } };
  }

  if (id === null) {
    const row = db.insert(projects).values(values).returning({ id: projects.id }).get();
    refreshPublic();
    redirect(`/admin/projects/${row.id}?saved=1`);
  }

  db.update(projects).set(values).where(eq(projects.id, id)).run();
  refreshPublic(`/work/${d.slug}`);
  return { ok: true };
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) redirect("/admin/projects");
  db.delete(projects).where(eq(projects.id, id)).run();
  refreshPublic();
  redirect("/admin/projects");
}

// ----------------------------------------------------------------- services

export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = rowId(formData);

  const parsed = serviceSchema.safeParse({
    ...(Object.fromEntries(formData) as Record<string, string>),
    highlighted: formData.get("highlighted") === "on",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const values = {
    ...parsed.data,
    features: JSON.stringify(parsed.data.features),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  if (id === null) {
    db.insert(services).values(values).run();
    refreshPublic();
    redirect("/admin/services");
  }

  db.update(services).set(values).where(eq(services.id, id)).run();
  refreshPublic();
  return { ok: true };
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) redirect("/admin/services");
  db.delete(services).where(eq(services.id, id)).run();
  refreshPublic();
  redirect("/admin/services");
}

// -------------------------------------------------------------------- posts

export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = rowId(formData);

  const parsed = postSchema.safeParse({
    ...(Object.fromEntries(formData) as Record<string, string>),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const d = parsed.data;
  const clash = db.select().from(posts).where(eq(posts.slug, d.slug)).get();
  if (clash && clash.id !== id) {
    return { error: "Bu slug band", fieldErrors: { slug: "Bu slug allaqachon ishlatilgan" } };
  }

  const values = { ...d, updatedAt: Math.floor(Date.now() / 1000) };

  if (id === null) {
    const row = db.insert(posts).values(values).returning({ id: posts.id }).get();
    refreshPublic();
    redirect(`/admin/journal/${row.id}?saved=1`);
  }

  db.update(posts).set(values).where(eq(posts.id, id)).run();
  refreshPublic(`/journal/${d.slug}`);
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) redirect("/admin/journal");
  db.delete(posts).where(eq(posts.id, id)).run();
  refreshPublic();
  redirect("/admin/journal");
}

// ----------------------------------------------------------------- messages

export async function setMessageRead(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;
  db.update(messages)
    .set({ read: formData.get("read") === "1" })
    .where(eq(messages.id, id))
    .run();
  revalidatePath("/admin/messages", "page");
}

export async function setMessageArchived(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;
  db.update(messages)
    .set({ archived: formData.get("archived") === "1" })
    .where(eq(messages.id, id))
    .run();
  revalidatePath("/admin/messages", "page");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;
  db.delete(messages).where(eq(messages.id, id)).run();
  revalidatePath("/admin/messages", "page");
}

// ----------------------------------------------------------------- settings

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const stamp = Math.floor(Date.now() / 1000);
  const rows = Object.entries(parsed.data).map(([key, raw]) => ({
    key,
    value: String(raw),
    updatedAt: stamp,
  }));

  // A single multi-row upsert rather than `db.transaction(...)`: the sync
  // transaction wrapper kills the Server Action's connection mid-response in
  // Next 16.2 (no error is logged, the socket just closes). One statement is
  // atomic in SQLite anyway, so this keeps the all-or-nothing guarantee.
  db.insert(settings)
    .values(rows)
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: sql`excluded.value`, updatedAt: stamp },
    })
    .run();

  refreshPublic();
  return { ok: true };
}
