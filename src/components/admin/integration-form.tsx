"use client";

import { useActionState } from "react";

import { saveIntegrations, type FormState } from "@/lib/actions/admin";
import type { IntegrationKey, IntegrationStatus } from "@/lib/integrations";
import { Field, SaveBar, inputCls } from "./ui";

const INITIAL: FormState = {};

const FIELDS: { key: IntegrationKey; label: string; hint: string; type?: "text" | "password" }[] = [
  { key: "githubToken", label: "GitHub token", hint: "Yopiq repo va yuqori limit uchun", type: "password" },
  { key: "vercelToken", label: "Vercel token", hint: "Vercel loyiha metama'lumotlari uchun", type: "password" },
  {
    key: "screenshotApiUrl",
    label: "Screenshot endpoint", 
    hint: "{url} yoki {url_raw} bilan siz ishonadigan capture URL", 
    type: "text",
  },
];

const STATUS_LABELS: Record<IntegrationStatus, string> = {
  empty: "BO'SH",
  stored: "SAQLANGAN",
  legacy: "QAYTA SAQLANG",
  invalid: "O'QILMAYDI",
  environment: "ENV ORQALI",
};

export function IntegrationForm({ status }: { status: Record<IntegrationKey, IntegrationStatus> }) {
  const [state, action] = useActionState<FormState, FormData>(saveIntegrations, INITIAL);
  return (
    <form action={action} className="rounded-[16px] border border-line bg-s1 p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="label text-[10px]">Integratsiyalar</h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-[1.6] text-tt">
            Bu qiymatlar APP_MASTER_KEY bilan bazada shifrlanadi va qayta ko&apos;rsatilmaydi.
            Bo&apos;sh maydon avvalgi qiymatni saqlaydi; “o&apos;chirish” uni bazadan olib tashlaydi.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} htmlFor={field.key} hint={field.hint}>
            <div className="relative">
              <input id={field.key} name={field.key} type={field.type} className={`${inputCls} pr-20`} />
              <span className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] ${status[field.key] === "stored" || status[field.key] === "environment" ? "text-ok" : status[field.key] === "invalid" ? "text-bad" : "text-tt"}`}>
                {STATUS_LABELS[status[field.key]]}
              </span>
            </div>
            {(status[field.key] === "stored" ||
              status[field.key] === "legacy" ||
              status[field.key] === "invalid") && (
              <label className="mt-2 flex items-center gap-2 text-xs text-tt">
                <input
                  type="checkbox"
                  name={`remove_${field.key}`}
                  className="size-3.5 accent-[var(--color-crimson)]"
                />
                Bazadagi qiymatni o&apos;chirish
              </label>
            )}
          </Field>
        ))}
      </div>
      <SaveBar ok={state.ok} error={state.error} />
    </form>
  );
}
