"use client";

import { useActionState } from "react";

import {
  captureShot,
  deleteProject,
  importSource,
  saveProject,
  type FormState,
  type SourceState,
} from "@/lib/actions/admin";
import type { ProjectView } from "@/lib/queries";
import { SourcePanel } from "./source-panel";
import { DangerButton, Field, SaveBar, Toggle, areaCls, inputCls } from "./ui";

const SECTIONS = [
  ["overview", "Umumiy"],
  ["problem", "Muammo"],
  ["research", "Tadqiqot"],
  ["solution", "Yechim"],
  ["process", "Jarayon"],
] as const;

const EMPTY_SOURCE: SourceState = {};

export function ProjectForm({ project }: { project?: ProjectView }) {
  const [state, action] = useActionState<FormState, FormData>(saveProject, {});
  const [importState, runImport] = useActionState<SourceState, FormData>(
    importSource,
    EMPTY_SOURCE,
  );
  const [shotState, runCapture] = useActionState<SourceState, FormData>(
    captureShot,
    EMPTY_SOURCE,
  );

  // A successful import refills the fields it owns. Remounting them by key is
  // what lets an uncontrolled input pick up a new default; fields the importer
  // knows nothing about — the case-study body — keep whatever was typed.
  const imported = importState.data;
  const stamp = importState.nonce ?? 0;

  return (
    <>
      <SourcePanel
        table="projects"
        rowId={project?.id}
        liveFieldName="liveUrl"
        liveFieldLabel="Jonli sayt manzili"
        initial={{
          sourceKind: project?.sourceKind ?? "manual",
          sourceUrl: project?.sourceUrl ?? "",
          liveUrl: project?.liveUrl ?? "",
          previewImage: project?.previewImage ?? "",
        }}
        importState={importState}
        runImport={runImport}
        shotState={shotState}
        runCapture={runCapture}
      />

      <form id="entity-form" action={action} className="mt-8">
        <input type="hidden" name="id" value={project?.id ?? ""} />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Sarlavha" htmlFor="title" error={state.fieldErrors?.title}>
            <input
              key={`title-${stamp}`}
              id="title"
              name="title"
              defaultValue={imported?.title ?? project?.title}
              className={inputCls}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            hint="URL manzili: /work/slug"
            error={state.fieldErrors?.slug}
          >
            <input
              key={`slug-${stamp}`}
              id="slug"
              name="slug"
              defaultValue={imported?.slug ?? project?.slug}
              className={inputCls}
            />
          </Field>
        </div>

        <Field
          label="Qisqacha"
          htmlFor="summary"
          className="mt-5"
          error={state.fieldErrors?.summary}
        >
          <textarea
            key={`summary-${stamp}`}
            id="summary"
            name="summary"
            rows={2}
            defaultValue={imported?.summary || project?.summary}
            className={areaCls}
          />
        </Field>

        <div className="mt-5 grid gap-5 md:grid-cols-4">
          <Field label="Turkum" htmlFor="category" error={state.fieldErrors?.category}>
            <select
              id="category"
              name="category"
              defaultValue={project?.category ?? "SI"}
              className={inputCls}
            >
              <option value="SI">SI</option>
              <option value="Mahsulot">Mahsulot</option>
              <option value="Tizim">Tizim</option>
            </select>
          </Field>

          <Field label="Yil" htmlFor="year" error={state.fieldErrors?.year}>
            <input
              key={`year-${stamp}`}
              id="year"
              name="year"
              inputMode="numeric"
              defaultValue={imported?.year ?? project?.year ?? String(new Date().getFullYear())}
              className={inputCls}
            />
          </Field>

          <Field label="Rang" htmlFor="tone" error={state.fieldErrors?.tone}>
            <select id="tone" name="tone" defaultValue={project?.tone ?? "gold"} className={inputCls}>
              <option value="gold">Oltin</option>
              <option value="azure">Moviy</option>
              <option value="green">Yashil</option>
              <option value="violet">Binafsha</option>
            </select>
          </Field>

          <Field label="Tartib" htmlFor="position" error={state.fieldErrors?.position}>
            <input
              id="position"
              name="position"
              inputMode="numeric"
              defaultValue={project?.position ?? 0}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Mijoz" htmlFor="client" error={state.fieldErrors?.client}>
            <input id="client" name="client" defaultValue={project?.client} className={inputCls} />
          </Field>
          <Field label="Rol" htmlFor="role" error={state.fieldErrors?.role}>
            <input id="role" name="role" defaultValue={project?.role} className={inputCls} />
          </Field>
        </div>

        <hr className="my-8 border-line" />
        <h2 className="label text-[10px]">Keys matni</h2>

        {SECTIONS.map(([key, label]) => (
          <Field key={key} label={label} htmlFor={key} className="mt-5">
            <textarea
              id={key}
              name={key}
              rows={4}
              defaultValue={project?.[key] ?? ""}
              placeholder="Bo'sh qoldirilsa bu bo'lim saytda ko'rinmaydi"
              className={areaCls}
            />
          </Field>
        ))}

        <hr className="my-8 border-line" />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Texnologiyalar" htmlFor="stack" hint="Har bir qatorda bittadan">
            <textarea
              key={`stack-${stamp}`}
              id="stack"
              name="stack"
              rows={5}
              defaultValue={(imported?.stack ?? project?.stack ?? []).join("\n")}
              placeholder={"Python\nRust\nPostgreSQL"}
              className={areaCls}
            />
          </Field>

          <Field label="Natijalar" htmlFor="metrics" hint="Qator formati: qiymat | izoh">
            <textarea
              id="metrics"
              name="metrics"
              rows={5}
              defaultValue={project?.metrics.map((m) => `${m.value} | ${m.label}`).join("\n")}
              placeholder={"143 | O'tgan test\n±3 | Yarim ton chegara"}
              className={areaCls}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Toggle name="published" label="Saytda ko'rinsin" defaultChecked={project?.published ?? true} />
          <Toggle
            name="featured"
            label="Bosh sahifada tanlangan"
            defaultChecked={project?.featured ?? false}
          />
        </div>

        <SaveBar ok={state.ok} error={state.error} />
      </form>

      {project && (
        <form action={deleteProject} className="mt-8 border-t border-line pt-6">
          <input type="hidden" name="id" value={project.id} />
          <p className="text-sm text-tt">
            O&apos;chirilgan loyihani tiklab bo&apos;lmaydi.
          </p>
          <div className="mt-3">
            <DangerButton type="submit">Loyihani o&apos;chirish</DangerButton>
          </div>
        </form>
      )}
    </>
  );
}
