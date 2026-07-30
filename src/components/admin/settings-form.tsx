"use client";

import { useActionState } from "react";

import { saveSettings, type FormState } from "@/lib/actions/admin";
import type { SiteSettings } from "@/lib/queries";
import { Field, SaveBar, areaCls, inputCls } from "./ui";

export function SettingsForm({ settings: s }: { settings: SiteSettings }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettings, {});
  const err = state.fieldErrors;

  return (
    <form action={action}>
      <h2 className="label text-[10px]">Holat</h2>
      <div className="mt-3 grid gap-5 md:grid-cols-2">
        <Field label="Bandlik" htmlFor="availability" error={err?.availability}>
          <select
            id="availability"
            name="availability"
            defaultValue={s.availability}
            className={inputCls}
          >
            <option value="open">Ochiq</option>
            <option value="limited">Cheklangan</option>
            <option value="closed">Yopiq</option>
          </select>
        </Field>
        <Field label="Holat matni" htmlFor="availabilityLabel" error={err?.availabilityLabel}>
          <input
            id="availabilityLabel"
            name="availabilityLabel"
            defaultValue={s.availabilityLabel}
            className={inputCls}
          />
        </Field>
      </div>

      <hr className="my-8 border-line" />
      <h2 className="label text-[10px]">Bosh sahifa</h2>

      <Field label="Yuqori yozuv" htmlFor="heroEyebrow" className="mt-3" error={err?.heroEyebrow}>
        <input
          id="heroEyebrow"
          name="heroEyebrow"
          defaultValue={s.heroEyebrow}
          className={inputCls}
        />
      </Field>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Field label="Sarlavha 1-qator" htmlFor="heroLine1" error={err?.heroLine1}>
          <input id="heroLine1" name="heroLine1" defaultValue={s.heroLine1} className={inputCls} />
        </Field>
        <Field label="2-qator" htmlFor="heroLine2" error={err?.heroLine2}>
          <input id="heroLine2" name="heroLine2" defaultValue={s.heroLine2} className={inputCls} />
        </Field>
        <Field label="Oltin so'z" htmlFor="heroAccent" error={err?.heroAccent}>
          <input
            id="heroAccent"
            name="heroAccent"
            defaultValue={s.heroAccent}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Tavsif" htmlFor="heroSubline" className="mt-5" error={err?.heroSubline}>
        <textarea
          id="heroSubline"
          name="heroSubline"
          rows={3}
          defaultValue={s.heroSubline}
          className={areaCls}
        />
      </Field>

      <hr className="my-8 border-line" />
      <h2 className="label text-[10px]">Men haqimda</h2>

      <Field label="Sarlavha" htmlFor="aboutTitle" className="mt-3" error={err?.aboutTitle}>
        <textarea
          id="aboutTitle"
          name="aboutTitle"
          rows={2}
          defaultValue={s.aboutTitle}
          className={areaCls}
        />
      </Field>

      <Field
        label="Matn"
        htmlFor="aboutBody"
        className="mt-5"
        hint="Abzatslar bo'sh qator bilan ajratiladi"
        error={err?.aboutBody}
      >
        <textarea
          id="aboutBody"
          name="aboutBody"
          rows={8}
          defaultValue={s.aboutBody}
          className={areaCls}
        />
      </Field>

      <hr className="my-8 border-line" />
      <h2 className="label text-[10px]">Aloqa</h2>

      <div className="mt-3 grid gap-5 md:grid-cols-2">
        <Field label="Email" htmlFor="email" error={err?.email}>
          <input id="email" name="email" type="email" defaultValue={s.email} className={inputCls} />
        </Field>
        <Field label="Telegram" htmlFor="telegram" error={err?.telegram}>
          <input
            id="telegram"
            name="telegram"
            defaultValue={s.telegram}
            placeholder="@ilyos"
            className={inputCls}
          />
        </Field>
        <Field label="GitHub havolasi" htmlFor="github" error={err?.github}>
          <input id="github" name="github" defaultValue={s.github} className={inputCls} />
        </Field>
        <Field label="LinkedIn havolasi" htmlFor="linkedin" error={err?.linkedin}>
          <input id="linkedin" name="linkedin" defaultValue={s.linkedin} className={inputCls} />
        </Field>
        <Field label="Shahar" htmlFor="location" error={err?.location}>
          <input id="location" name="location" defaultValue={s.location} className={inputCls} />
        </Field>
      </div>

      <SaveBar ok={state.ok} error={state.error} />
    </form>
  );
}
