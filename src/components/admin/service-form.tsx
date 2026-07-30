"use client";

import { useActionState } from "react";

import { deleteService, saveService, type FormState } from "@/lib/actions/admin";
import type { ServiceView } from "@/lib/queries";
import { DangerButton, Field, SaveBar, Toggle, areaCls, inputCls } from "./ui";

export function ServiceForm({ service }: { service?: ServiceView }) {
  const [state, action] = useActionState<FormState, FormData>(saveService, {});

  return (
    <>
      <form action={action}>
        <input type="hidden" name="id" value={service?.id ?? ""} />
        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Nomi"
            htmlFor="title"
            className="md:col-span-2"
            error={state.fieldErrors?.title}
          >
            <input id="title" name="title" defaultValue={service?.title} className={inputCls} />
          </Field>
          <Field label="Muddat" htmlFor="duration" error={state.fieldErrors?.duration}>
            <input
              id="duration"
              name="duration"
              defaultValue={service?.duration}
              placeholder="6–12 hafta"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Tavsif" htmlFor="description" className="mt-5">
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={service?.description}
            className={areaCls}
          />
        </Field>

        <Field
          label="Nima kiradi"
          htmlFor="features"
          className="mt-5"
          hint="Har bir qatorda bittadan"
        >
          <textarea
            id="features"
            name="features"
            rows={5}
            defaultValue={service?.features.join("\n")}
            placeholder={"Arxitektura auditi\nTezlik profili"}
            className={areaCls}
          />
        </Field>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Narx izohi" htmlFor="priceNote">
            <input
              id="priceNote"
              name="priceNote"
              defaultValue={service?.priceNote}
              placeholder="Belgilangan narx"
              className={inputCls}
            />
          </Field>
          <Field label="Tartib" htmlFor="position" error={state.fieldErrors?.position}>
            <input
              id="position"
              name="position"
              inputMode="numeric"
              defaultValue={service?.position ?? 0}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Toggle name="published" label="Saytda ko'rinsin" defaultChecked={service?.published ?? true} />
          <Toggle
            name="highlighted"
            label="«Ko'p tanlanadi» deb belgilansin"
            defaultChecked={service?.highlighted ?? false}
          />
        </div>

        <SaveBar ok={state.ok} error={state.error} />
      </form>

      {service && (
        <form action={deleteService} className="mt-8 border-t border-line pt-6">
          <input type="hidden" name="id" value={service.id} />
          <DangerButton type="submit">Xizmatni o&apos;chirish</DangerButton>
        </form>
      )}
    </>
  );
}
