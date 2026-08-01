"use client";

import { useActionState } from "react";

import {
  captureShot,
  deleteProduct,
  importSource,
  saveProduct,
  type FormState,
  type SourceState,
} from "@/lib/actions/admin";
import type { ProductView } from "@/lib/queries";
import { SourcePanel } from "./source-panel";
import { DangerButton, Field, SaveBar, Toggle, areaCls, inputCls } from "./ui";

const EMPTY_SOURCE: SourceState = {};

export function ProductForm({ product }: { product?: ProductView }) {
  const [state, action] = useActionState<FormState, FormData>(saveProduct, {});
  const [importState, runImport] = useActionState<SourceState, FormData>(
    importSource,
    EMPTY_SOURCE,
  );
  const [shotState, runCapture] = useActionState<SourceState, FormData>(
    captureShot,
    EMPTY_SOURCE,
  );

  const imported = importState.data;
  const stamp = importState.nonce ?? 0;

  return (
    <>
      <SourcePanel
        table="products"
        rowId={product?.id}
        liveFieldName="demoUrl"
        liveFieldLabel="Demo sayt manzili"
        initial={{
          sourceKind: product?.sourceKind ?? "manual",
          sourceUrl: product?.sourceUrl ?? "",
          liveUrl: product?.demoUrl ?? "",
          previewImage: product?.previewImage ?? "",
        }}
        importState={importState}
        runImport={runImport}
        shotState={shotState}
        runCapture={runCapture}
      />

      <form id="entity-form" action={action} className="mt-8">
        <input type="hidden" name="id" value={product?.id ?? ""} />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nomi" htmlFor="title" error={state.fieldErrors?.title}>
            <input
              key={`title-${stamp}`}
              id="title"
              name="title"
              defaultValue={imported?.title ?? product?.title}
              className={inputCls}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            hint="URL manzili: /tayyor-saytlar/slug"
            error={state.fieldErrors?.slug}
          >
            <input
              key={`slug-${stamp}`}
              id="slug"
              name="slug"
              defaultValue={imported?.slug ?? product?.slug}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Qisqacha" htmlFor="summary" className="mt-5" error={state.fieldErrors?.summary}>
          <textarea
            key={`summary-${stamp}`}
            id="summary"
            name="summary"
            rows={2}
            defaultValue={imported?.summary || product?.summary}
            placeholder="Bir jumlada: bu kim uchun va nima qiladi"
            className={areaCls}
          />
        </Field>

        <Field label="To'liq tavsif" htmlFor="description" className="mt-5">
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={product?.description}
            placeholder="Bo'sh qatorlar bilan ajratilgan paragraflar"
            className={areaCls}
          />
        </Field>

        <hr className="my-8 border-line" />
        <h2 className="label text-[10px]">Narx va holat</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-4">
          <Field
            label="Narx"
            htmlFor="price"
            hint="0 — «kelishiladi»"
            error={state.fieldErrors?.price}
          >
            <input
              id="price"
              name="price"
              inputMode="numeric"
              defaultValue={product?.price ?? 0}
              className={inputCls}
            />
          </Field>

          <Field label="Valyuta" htmlFor="currency" error={state.fieldErrors?.currency}>
            <select
              id="currency"
              name="currency"
              defaultValue={product?.currency ?? "USD"}
              className={inputCls}
            >
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>

          <Field label="Turkum" htmlFor="category" error={state.fieldErrors?.category}>
            <select
              id="category"
              name="category"
              defaultValue={product?.category ?? "Biznes"}
              className={inputCls}
            >
              <option value="Biznes">Biznes</option>
              <option value="Do'kon">Do&apos;kon</option>
              <option value="Landing">Landing</option>
              <option value="Portfolio">Portfolio</option>
              <option value="Panel">Panel</option>
            </select>
          </Field>

          <Field label="Holat" htmlFor="status" error={state.fieldErrors?.status}>
            <select
              id="status"
              name="status"
              defaultValue={product?.status ?? "available"}
              className={inputCls}
            >
              <option value="available">Sotuvda</option>
              <option value="reserved">Band qilingan</option>
              <option value="sold">Sotilgan</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Narx izohi" htmlFor="priceNote" hint="Masalan: domen va 1 yil hosting bilan">
            <input
              id="priceNote"
              name="priceNote"
              defaultValue={product?.priceNote}
              className={inputCls}
            />
          </Field>
          <Field label="Tartib" htmlFor="position" error={state.fieldErrors?.position}>
            <input
              id="position"
              name="position"
              inputMode="numeric"
              defaultValue={product?.position ?? 0}
              className={inputCls}
            />
          </Field>
        </div>

        <hr className="my-8 border-line" />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Texnologiyalar" htmlFor="stack" hint="Har bir qatorda bittadan">
            <textarea
              key={`stack-${stamp}`}
              id="stack"
              name="stack"
              rows={5}
              defaultValue={(imported?.stack ?? product?.stack ?? []).join("\n")}
              placeholder={"Next.js\nPostgreSQL\nTailwind"}
              className={areaCls}
            />
          </Field>

          <Field label="Nima kiradi" htmlFor="includes" hint="Har bir qatorda bittadan">
            <textarea
              id="includes"
              name="includes"
              rows={5}
              defaultValue={product?.includes.join("\n")}
              placeholder={"To'liq manba kodi\nAdmin panel\nDomen ulash\n1 oy qo'llab-quvvatlash"}
              className={areaCls}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Toggle
            name="published"
            label="Do'konda ko'rinsin"
            defaultChecked={product?.published ?? true}
          />
          <Toggle
            name="featured"
            label="Bosh sahifada tanlangan"
            defaultChecked={product?.featured ?? false}
          />
        </div>

        <SaveBar ok={state.ok} error={state.error} />
      </form>

      {product && (
        <form action={deleteProduct} className="mt-8 border-t border-line pt-6">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-sm text-tt">O&apos;chirilgan e&apos;lonni tiklab bo&apos;lmaydi.</p>
          <div className="mt-3">
            <DangerButton type="submit">E&apos;lonni o&apos;chirish</DangerButton>
          </div>
        </form>
      )}
    </>
  );
}
