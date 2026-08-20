"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import type { SourceState } from "@/lib/actions/admin";
import { Field, inputCls } from "./ui";

export type SourceValues = {
  sourceKind: string;
  sourceUrl: string;
  liveUrl: string;
  previewImage: string;
};

/**
 * The "where did this come from" half of a project or product form.
 *
 * It sits *outside* the main form on purpose: importing and capturing are their
 * own submissions, and a form cannot be nested inside another. What the panel
 * produces reaches the main form through hidden inputs carrying `form=`, so the
 * admin still reviews everything and presses Save once.
 *
 * The action state is owned by the parent, which needs it anyway to refill its
 * own fields.
 */
export function SourcePanel({
  table,
  rowId,
  initial,
  liveFieldName,
  liveFieldLabel,
  importState,
  runImport,
  shotState,
  runCapture,
}: {
  table: "projects" | "products";
  /** Absent for an unsaved row — the capture then travels in the hidden field only. */
  rowId?: number;
  initial: SourceValues;
  /** `liveUrl` on a project, `demoUrl` on a listing — same URL, different column. */
  liveFieldName: "liveUrl" | "demoUrl";
  liveFieldLabel: string;
  importState: SourceState;
  runImport: (formData: FormData) => void;
  shotState: SourceState;
  runCapture: (formData: FormData) => void;
}) {
  const imported = importState.data;

  // Both async results are *derived*, never copied into state by an effect.
  // The screenshot has exactly one owner at a time — the last capture if there
  // was one, otherwise whatever is stored — and clearing it goes through the
  // same action, which is what keeps the orphaned asset from piling up.
  const previewImage = shotState.shot ?? initial.previewImage;

  return (
    <section className="rounded-[16px] border border-line bg-s1 p-5 md:p-6">
      <h2 className="label text-[10px]">Manba</h2>
      <p className="mt-1.5 text-xs text-tt">
        GitHub repozitoriysi yoki Vercel loyihasidan ma&apos;lumot real vaqtda tortiladi.
      </p>

      {/*
        A fresh import replaces the editable source fields wholesale. Remounting
        on the import nonce is what lets uncontrolled state take new defaults,
        and it deliberately does not react to captures — a screenshot must not
        undo a URL the admin has just typed.
      */}
      <SourceFields
        key={`import-${importState.nonce ?? 0}`}
        table={table}
        rowId={rowId}
        liveFieldName={liveFieldName}
        liveFieldLabel={liveFieldLabel}
        previewImage={previewImage}
        runCapture={runCapture}
        runImport={runImport}
        importState={importState}
        shotState={shotState}
        initial={{
          sourceKind: imported?.kind ?? initial.sourceKind ?? "manual",
          sourceUrl: imported?.sourceUrl ?? initial.sourceUrl,
          liveUrl: imported?.liveUrl || initial.liveUrl,
          previewImage,
        }}
      />
    </section>
  );
}

function SourceFields({
  table,
  rowId,
  initial,
  liveFieldName,
  liveFieldLabel,
  previewImage,
  importState,
  runImport,
  shotState,
  runCapture,
}: {
  table: "projects" | "products";
  rowId?: number;
  initial: SourceValues;
  liveFieldName: "liveUrl" | "demoUrl";
  liveFieldLabel: string;
  previewImage: string;
  importState: SourceState;
  runImport: (formData: FormData) => void;
  shotState: SourceState;
  runCapture: (formData: FormData) => void;
}) {
  const [sourceKind, setSourceKind] = useState(initial.sourceKind || "manual");
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl);
  const [liveUrl, setLiveUrl] = useState(initial.liveUrl);

  return (
    <>
      {/* ------------------------------------------------------------ import */}
      <form action={runImport} className="mt-4 grid gap-3 md:grid-cols-[150px_1fr_auto]">
        <select
          name="sourceKind"
          value={sourceKind === "manual" ? "" : sourceKind}
          onChange={(e) => setSourceKind(e.target.value || "manual")}
          aria-label="Manba turi"
          className={inputCls}
        >
          <option value="">Avtomatik</option>
          <option value="github">GitHub</option>
          <option value="vercel">Vercel</option>
        </select>
        <input
          name="sourceInput"
          defaultValue={sourceUrl}
          placeholder="github.com/ism/repo yoki loyiha.vercel.app"
          aria-label="Manba havolasi"
          className={inputCls}
        />
        <PanelButton idle="Tortib olish" busy="Tortilmoqda…" />
      </form>

      {importState.error && (
        <p className="mt-2.5 text-xs text-bad" role="alert">
          {importState.error}
        </p>
      )}
      {importState.ok && (
        <p className="mt-2.5 text-xs text-ok" role="status">
          Ma&apos;lumot tortildi — tekshirib, Saqlashni bosing.
        </p>
      )}

      <Field label="Repozitoriy havolasi" htmlFor="source-url" className="mt-5">
        <input
          id="source-url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://github.com/…"
          className={inputCls}
        />
      </Field>

      <hr className="my-6 border-line" />

      {/* -------------------------------------------------------- screenshot */}
      <h2 className="label text-[10px]">Ekran surati</h2>
      <p className="mt-1.5 text-xs text-tt">
        Jonli saytdan olinadi va bazaga saqlanadi — saytda aynan shu rasm ko&apos;rinadi.
        Yangi sayt bo&apos;lsa render bo&apos;lguncha bir-ikki marta urinish kerak bo&apos;lishi
        mumkin.
      </p>

      <form action={runCapture} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={rowId ?? ""} />
        <input type="hidden" name="previewImage" value={previewImage} />
        <input
          name="liveUrl"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          placeholder="https://loyiha.vercel.app"
          aria-label={liveFieldLabel}
          className={inputCls}
        />
        <PanelButton idle="Screenshot ol" busy="Olinmoqda…" />
      </form>

      {shotState.error && (
        <p className="mt-2.5 text-xs text-bad" role="alert">
          {shotState.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <div className="relative aspect-[16/10] w-full max-w-[280px] overflow-hidden rounded-[12px] border border-line bg-base">
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Saqlangan ekran surati"
              fill
              sizes="280px"
              // The panel is the whole point of the page; this is its LCP.
              priority
              className="object-cover object-top"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-tt">
              Hali surat yo&apos;q
            </span>
          )}
        </div>

        {previewImage && (
          <form action={runCapture}>
            <input type="hidden" name="table" value={table} />
            <input type="hidden" name="id" value={rowId ?? ""} />
            <input type="hidden" name="previewImage" value={previewImage} />
            <input type="hidden" name="liveUrl" value={liveUrl} />
            <input type="hidden" name="intent" value="clear" />
            <ClearButton />
          </form>
        )}
      </div>

      {/* The panel's values reach the main form through these mirrors: `form=`
          submits an input with a form it is not physically inside. */}
      <input type="hidden" form="entity-form" name="sourceKind" value={sourceKind} />
      <input type="hidden" form="entity-form" name="sourceUrl" value={sourceUrl} />
      <input type="hidden" form="entity-form" name={liveFieldName} value={liveUrl} />
      <input type="hidden" form="entity-form" name="previewImage" value={previewImage} />
    </>
  );
}

function PanelButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line-accent px-5 text-sm font-medium text-accent-text transition-colors hover:bg-crimson-900 disabled:opacity-50"
    >
      {pending ? busy : idle}
    </button>
  );
}

function ClearButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center rounded-lg border border-line-2 px-3.5 text-[13px] text-ts transition-colors hover:border-line-3 hover:text-tp disabled:opacity-50"
    >
      {pending ? "O'chirilmoqda…" : "Rasmni olib tashlash"}
    </button>
  );
}
