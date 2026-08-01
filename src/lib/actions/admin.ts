"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { integrationSecrets, messages, orders, posts, products, projects, services, settings } from "@/db/schema";
import { encryptIntegrationSecret } from "@/lib/integrations";
import { captureScreenshot, dropAsset } from "@/lib/screenshot";
import { readSession } from "@/lib/session";
import { importFromUrl, type ImportedSource } from "@/lib/sources";
import {
  orderStatusSchema,
  integrationsSchema,
  postSchema,
  productSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
} from "@/lib/validators";

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
 * action's response, and those renders re-query the database from
 * inside the action's own render pass, which deadlocks the response stream:
 * the write lands but the reply never arrives. Narrow page-level invalidation
 * keeps the router honest without that blast radius.
 */
function refreshPublic(...extra: string[]) {
  revalidatePath("/", "page");
  for (const path of extra) revalidatePath(path, "page");
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
    updatedAt: new Date(),
  };

  // Slug is unique; surface the collision instead of letting Postgres throw.
  const [clash] = await db.select().from(projects).where(eq(projects.slug, d.slug)).limit(1);
  if (clash && clash.id !== id) {
    return { error: "Bu slug band", fieldErrors: { slug: "Bu slug allaqachon ishlatilgan" } };
  }

  if (id === null) {
    const [row] = await db.insert(projects).values(values).returning({ id: projects.id });
    refreshPublic("/work");
    redirect(`/admin/projects/${row.id}?saved=1`);
  }

  // A screenshot that is no longer referenced would otherwise sit in `assets`
  // forever; the row is only dropped after the new value is safely written.
  const [before] = await db
    .select({ previewImage: projects.previewImage })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  await db.update(projects).set(values).where(eq(projects.id, id));
  if (before && before.previewImage !== d.previewImage) await dropAsset(before.previewImage);

  refreshPublic("/work", `/work/${d.slug}`);
  return { ok: true };
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) redirect("/admin/projects");

  const [row] = await db
    .select({ previewImage: projects.previewImage })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  await db.delete(projects).where(eq(projects.id, id));
  await dropAsset(row?.previewImage);
  refreshPublic("/work");
  redirect("/admin/projects");
}

// ------------------------------------------------- source import & screenshot

export type SourceState = {
  ok?: boolean;
  error?: string;
  /** Fields pulled from GitHub or Vercel, for the form to apply. */
  data?: ImportedSource;
  /** `/api/shot/:id` for a freshly captured screenshot. */
  shot?: string;
  /** Bumped on every run so the client can react to two identical results. */
  nonce?: number;
};

/**
 * Reads a repository or deployment and hands the metadata back to the form.
 *
 * Nothing is written here: the admin sees the pulled values in the fields and
 * still has to press Save. An import that silently mutated the row would make
 * "check what it found, then commit" impossible.
 */
export async function importSource(_prev: SourceState, formData: FormData): Promise<SourceState> {
  await requireAdmin();

  const input = String(formData.get("sourceInput") ?? "");
  const kindRaw = String(formData.get("sourceKind") ?? "");
  const kind = kindRaw === "github" || kindRaw === "vercel" ? kindRaw : undefined;

  const result = await importFromUrl(input, kind);
  if (!result.ok) return { error: result.error, nonce: Date.now() };
  return { ok: true, data: result.data, nonce: Date.now() };
}

/**
 * Captures the live site and stores the pixels locally.
 *
 * When the row already exists the new path is persisted immediately rather than
 * waiting for Save — the capture cost real seconds and a mis-click on "back"
 * should not throw it away. Unsaved rows carry it in a hidden field instead.
 */
export async function captureShot(_prev: SourceState, formData: FormData): Promise<SourceState> {
  await requireAdmin();

  const isProduct = String(formData.get("table") ?? "projects") === "products";
  const id = rowId(formData);
  const previous = String(formData.get("previewImage") ?? "");

  /** Persists a path on an already-saved row. New rows carry it in the form. */
  const store = async (path: string) => {
    if (id === null) return;
    if (isProduct) {
      await db.update(products).set({ previewImage: path }).where(eq(products.id, id));
      refreshPublic("/tayyor-saytlar");
    } else {
      await db.update(projects).set({ previewImage: path }).where(eq(projects.id, id));
      refreshPublic("/work");
    }
  };

  // Removing the shot runs through the same action so the stored bytes are
  // actually deleted; clearing a hidden field would only orphan the row.
  if (formData.get("intent") === "clear") {
    await store("");
    await dropAsset(previous);
    return { ok: true, shot: "", nonce: Date.now() };
  }

  const target = String(formData.get("liveUrl") ?? "").trim();
  if (!target) return { error: "Avval sayt manzilini kiriting", nonce: Date.now() };

  const result = await captureScreenshot(target, previous);
  if (!result.ok) return { error: result.error, nonce: Date.now() };

  await store(result.path);
  return { ok: true, shot: result.path, nonce: Date.now() };
}

// ----------------------------------------------------------------- products

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = rowId(formData);

  const parsed = productSchema.safeParse({
    ...(Object.fromEntries(formData) as Record<string, string>),
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const d = parsed.data;
  const values = {
    ...d,
    stack: JSON.stringify(d.stack),
    includes: JSON.stringify(d.includes),
    updatedAt: new Date(),
  };

  const [clash] = await db.select().from(products).where(eq(products.slug, d.slug)).limit(1);
  if (clash && clash.id !== id) {
    return { error: "Bu slug band", fieldErrors: { slug: "Bu slug allaqachon ishlatilgan" } };
  }

  if (id === null) {
    const [row] = await db.insert(products).values(values).returning({ id: products.id });
    refreshPublic("/tayyor-saytlar");
    redirect(`/admin/store/${row.id}?saved=1`);
  }

  const [before] = await db
    .select({ previewImage: products.previewImage })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  await db.update(products).set(values).where(eq(products.id, id));
  if (before && before.previewImage !== d.previewImage) await dropAsset(before.previewImage);

  refreshPublic("/tayyor-saytlar", `/tayyor-saytlar/${d.slug}`);
  return { ok: true };
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) redirect("/admin/store");

  const [row] = await db
    .select({ previewImage: products.previewImage })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  await db.delete(products).where(eq(products.id, id));
  await dropAsset(row?.previewImage);
  refreshPublic("/tayyor-saytlar");
  redirect("/admin/store");
}

// ------------------------------------------------------------------- orders

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;

  const parsed = orderStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  await db.update(orders).set({ status: parsed.data }).where(eq(orders.id, id));
  revalidatePath("/admin/orders", "page");
}

export async function deleteOrder(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;
  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath("/admin/orders", "page");
}

// ----------------------------------------------------------------- services

export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = rowId(formData);

  const parsed = serviceSchema.safeParse({
    ...(Object.fromEntries(formData) as Record<string, string>),
    // Unchecked boxes are absent from the payload, so each one is read
    // explicitly rather than left to coercion of a value that never arrives.
    priceFrom: formData.get("priceFrom") === "on",
    highlighted: formData.get("highlighted") === "on",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const values = {
    ...parsed.data,
    features: JSON.stringify(parsed.data.features),
    updatedAt: new Date(),
  };

  if (id === null) {
    await db.insert(services).values(values);
    refreshPublic("/services");
    redirect("/admin/services");
  }

  await db.update(services).set(values).where(eq(services.id, id));
  refreshPublic("/services");
  return { ok: true };
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) redirect("/admin/services");
  await db.delete(services).where(eq(services.id, id));
  refreshPublic("/services");
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
  const [clash] = await db.select().from(posts).where(eq(posts.slug, d.slug)).limit(1);
  if (clash && clash.id !== id) {
    return { error: "Bu slug band", fieldErrors: { slug: "Bu slug allaqachon ishlatilgan" } };
  }

  const values = { ...d, updatedAt: new Date() };

  if (id === null) {
    const [row] = await db.insert(posts).values(values).returning({ id: posts.id });
    refreshPublic();
    redirect(`/admin/journal/${row.id}?saved=1`);
  }

  await db.update(posts).set(values).where(eq(posts.id, id));
  refreshPublic(`/journal/${d.slug}`);
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) redirect("/admin/journal");
  await db.delete(posts).where(eq(posts.id, id));
  refreshPublic();
  redirect("/admin/journal");
}

// ----------------------------------------------------------------- messages

export async function setMessageRead(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;
  await db.update(messages)
    .set({ read: formData.get("read") === "1" })
    .where(eq(messages.id, id))
  revalidatePath("/admin/messages", "page");
}

export async function setMessageArchived(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;
  await db.update(messages)
    .set({ archived: formData.get("archived") === "1" })
    .where(eq(messages.id, id))
  revalidatePath("/admin/messages", "page");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (id === null) return;
  await db.delete(messages).where(eq(messages.id, id));
  revalidatePath("/admin/messages", "page");
}

// ----------------------------------------------------------------- settings

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const stamp = new Date();
  const rows = Object.entries(parsed.data).map(([key, raw]) => ({
    key,
    value: String(raw),
    updatedAt: stamp,
  }));

  // A single multi-row upsert rather than `db.transaction(...)`: the transaction
  // wrapper kills the Server Action's connection mid-response in Next 16.2 (no
  // error is logged, the socket just closes). One statement is atomic in
  // Postgres anyway, so this keeps the all-or-nothing guarantee.
  await db.insert(settings)
    .values(rows)
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: sql`excluded.value`, updatedAt: stamp },
    })

  refreshPublic();
  return { ok: true };
}

// ------------------------------------------------------------ integrations

/**
 * Keys are deliberately accepted only from the owner-only dashboard, encrypted
 * before persisting, and never returned to the browser. The three integrations
 * are read by the actual GitHub/Vercel import and screenshot code above.
 */
export async function saveIntegrations(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = integrationsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Formani tekshiring", fieldErrors: collect(parsed.error) };

  const values = Object.entries(parsed.data)
    .filter(([, value]) => value.length > 0)
    .map(([key, value]) => ({ key, encryptedValue: encryptIntegrationSecret(value), updatedAt: new Date() }));
  if (values.length === 0) return { ok: true };

  await db.insert(integrationSecrets).values(values).onConflictDoUpdate({
    target: integrationSecrets.key,
    set: { encryptedValue: sql`excluded.encrypted_value`, updatedAt: sql`excluded.updated_at` },
  });
  return { ok: true };
}
