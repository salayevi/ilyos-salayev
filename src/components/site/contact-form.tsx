"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitMessage, type ContactState } from "@/lib/actions/contact";

const INITIAL: ContactState = { status: "idle" };

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

export function ContactForm() {
  const [state, action] = useActionState(submitMessage, INITIAL);

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

  const inputCls =
    "h-12 w-full rounded-lg border border-line-2 bg-s2 px-4 text-[15px] text-tp placeholder:text-tt focus:border-accent focus:outline-none";

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
