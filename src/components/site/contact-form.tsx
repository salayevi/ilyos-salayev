"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitMessage, type ContactState } from "@/lib/actions/contact";
import {
  BUDGETS,
  CONTACT_METHODS,
  SERVICES,
  TIERS,
  TIMELINES,
  tierLabel,
  type Choice,
} from "@/lib/leads";

const INITIAL: ContactState = { status: "idle" };

const inputCls =
  "h-12 w-full rounded-lg border border-line-2 bg-s2 px-4 text-[15px] text-tp placeholder:text-tt focus:border-accent focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 flex h-12.5 w-full items-center justify-center rounded-lg bg-accent text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover disabled:bg-s3 disabled:text-td md:w-55"
    >
      {pending ? "Yuborilmoqda…" : "Yuborish"}
    </button>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label text-[10px] md:text-[11px]">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[13px] text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function Select({
  id,
  label,
  options,
  placeholder,
  defaultValue,
}: {
  id: string;
  label: string;
  options: Choice[];
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <Field id={id} label={label}>
      <select id={id} name={id} defaultValue={defaultValue ?? ""} className={inputCls}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/**
 * The project enquiry.
 *
 * Three fields are required and nothing else is. The rest sits behind one
 * disclosure, because the alternative — eleven fields on first paint — reads as
 * a form to fill in rather than a conversation to start, and the people most
 * worth hearing from are the ones least willing to fill in a form.
 *
 * The trade the disclosure makes is deliberate: a reply to "I want a website"
 * costs a round trip to ask about scope, budget and date. Anyone who opens the
 * block saves that round trip, and anyone who does not is no worse off than
 * they were with the old three-field version.
 *
 * `defaultTier` arrives from a plan card on /pricing. When it is set the block
 * starts open and the tier is preselected — the visitor already made that
 * choice one page ago, and hiding it would ask them to make it twice.
 */
export function ContactForm({ defaultTier = "" }: { defaultTier?: string }) {
  const [state, action] = useActionState(submitMessage, INITIAL);
  const cameFromPricing = TIERS.some((t) => t.value === defaultTier);

  if (state.status === "success") {
    return (
      <div className="rounded-[16px] border border-ok bg-s1 p-8 text-center md:p-10">
        <div
          aria-hidden
          className="mx-auto flex size-13 items-center justify-center rounded-full border-[1.5px] border-ok text-2xl text-ok"
        >
          &#10003;
        </div>
        <p className="mt-5 text-2xl font-medium">Xabar yetib bordi</p>
        <p className="mt-2.5 text-[15px] leading-[1.7] text-ts">
          Bir ish kuni ichida javob beraman. Shoshilinch bo&apos;lsa Telegramga yozing.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="rounded-[16px] border border-line bg-s1 p-5 md:p-10">
      <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-6">
        <Field id="name" label="Ismingiz" error={state.errors?.name}>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Ilyos"
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
            className={`${inputCls} ${state.errors?.name ? "border-bad" : ""}`}
          />
        </Field>

        <Field id="email" label="Email" error={state.errors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="siz@kompaniya.com"
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
            className={`${inputCls} ${state.errors?.email ? "border-bad" : ""}`}
          />
        </Field>
      </div>

      <div className="mt-5 md:mt-6">
        <Field id="body" label="Loyiha haqida" error={state.errors?.body}>
          <textarea
            id="body"
            name="body"
            required
            rows={5}
            placeholder="Nima qurmoqchisiz va qachonga kerak?"
            aria-invalid={Boolean(state.errors?.body)}
            aria-describedby={state.errors?.body ? "body-error" : undefined}
            className={`w-full rounded-lg border border-line-2 bg-s2 p-4 text-[15px] leading-[1.6] text-tp placeholder:text-tt focus:border-accent focus:outline-none ${
              state.errors?.body ? "border-bad" : ""
            }`}
          />
        </Field>
      </div>

      {/*
        Native disclosure rather than a state toggle: it works before hydration,
        the summary is already a focusable control with the right role, and the
        open state survives a failed submission without being tracked.
      */}
      <details open={cameFromPricing} className="group mt-5 md:mt-6">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg border border-line-2 px-4 py-3 text-[14px] text-ts transition-colors hover:border-line-3 hover:text-tp [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden
            className="text-accent-text transition-transform duration-300 group-open:rotate-45"
          >
            +
          </span>
          Loyiha tafsilotlari
          <span className="ml-auto text-[12px] text-tt">
            {cameFromPricing ? tierLabel(defaultTier) : "ixtiyoriy"}
          </span>
        </summary>

        <div className="mt-4 flex flex-col gap-5 md:gap-6">
          <p className="text-[13px] leading-[1.6] text-tt">
            Bularni to&apos;ldirsangiz, birinchi javobim savol emas, taklif bo&apos;ladi.
          </p>

          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            <Select
              id="service"
              label="Qanday ish"
              options={SERVICES}
              placeholder="Tanlang"
            />
            <Select
              id="tier"
              label="Tarif"
              options={TIERS}
              placeholder="Hali tanlamadim"
              defaultValue={cameFromPricing ? defaultTier : ""}
            />
            <Select id="budget" label="Byudjet" options={BUDGETS} placeholder="Tanlang" />
            <Select id="timeline" label="Muddat" options={TIMELINES} placeholder="Tanlang" />

            <Field id="company" label="Kompaniya">
              <input
                id="company"
                name="company"
                autoComplete="organization"
                placeholder="Ixtiyoriy"
                className={inputCls}
              />
            </Field>

            <Field id="phone" label="Telefon">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+998 …"
                className={inputCls}
              />
            </Field>

            <Select
              id="preferredContact"
              label="Qulay aloqa"
              options={CONTACT_METHODS}
              placeholder="Farqi yo'q"
            />
          </div>
        </div>
      </details>

      {/* Honeypot: positioned off-screen rather than display:none so bots that
          check computed styles still fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Veb-sayt</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message && (
        <p role="alert" className="mt-4 text-[13px] text-bad">
          {state.message}
        </p>
      )}

      <Submit />
    </form>
  );
}
