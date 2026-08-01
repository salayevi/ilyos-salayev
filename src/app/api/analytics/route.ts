import { z } from "zod";

import { recordAnalyticsEvent, setAnalyticsConsent } from "@/lib/analytics";

const bodySchema = z.object({
  intent: z.enum(["consent", "event"]),
  allowed: z.boolean().optional(),
  type: z.enum(["pageview", "navigation"]).optional(),
  path: z.string().max(240).optional(),
  label: z.string().max(160).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  if (parsed.data.intent === "consent") {
    await setAnalyticsConsent(parsed.data.allowed === true);
    return Response.json({ ok: true });
  }

  if (!parsed.data.type || !parsed.data.path) {
    return Response.json({ error: "Hodisa to'liq emas" }, { status: 400 });
  }
  await recordAnalyticsEvent({ type: parsed.data.type, path: parsed.data.path, label: parsed.data.label });
  return Response.json({ ok: true });
}
