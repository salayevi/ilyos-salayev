"use client";

import { useActionState } from "react";

import { saveIntegrations, type FormState } from "@/lib/actions/admin";
import type { IntegrationKey } from "@/lib/integrations";
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

export function IntegrationForm({ status }: { status: Record<IntegrationKey, boolean> }) {
  const [state, action] = useActionState<FormState, FormData>(saveIntegrations, INITIAL);
  return (
    <form action={action} className="rounded-[16px] border border-line bg-s1 p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="label text-[10px]">Integratsiyalar</h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-[1.6] text-tt">
            Bu qiymatlar bazada shifrlanadi va qayta ko&apos;rsatilmaydi. Bo&apos;sh qoldirilgan maydon avvalgi kalitni o&apos;zgartirmaydi.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} htmlFor={field.key} hint={field.hint}>
            <div className="relative">
              <input id={field.key} name={field.key} type={field.type} className={`${inputCls} pr-20`} />
              <span className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] ${status[field.key] ? "text-ok" : "text-tt"}`}>
                {status[field.key] ? "ULANGAN" : "BO'SH"}
              </span>
            </div>
          </Field>
        ))}
      </div>
      <SaveBar ok={state.ok} error={state.error} />
    </form>
  );
}
