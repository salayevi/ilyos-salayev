"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitEstimate, type EstimateContactState } from "@/lib/actions/estimate";

const INITIAL: EstimateContactState = { status: "idle" };

const inputCls =
  "h-12 w-full rounded-lg border border-line-2 bg-s2 px-4 text-[15px] text-tp placeholder:text-tt focus:border-accent focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-7 text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover disabled:bg-s3 disabled:text-td sm:w-auto"
    >
      {pending ? "Yuborilmoqda…" : "Loyihani boshlash"}
    </button>
  );
}

/**
 * Attaches a name to a saved estimate.
 *
 * Not a link to the contact page. Sending someone there would ask them to
 * describe a project they have just spent five minutes configuring, and would
 * file the result as a second record beside the one that already holds the
 * scope and the price. Four fields here, and the estimate becomes the enquiry.
 */
export function EstimateContact({ publicId }: { publicId: string }) {
  const [state, action] = useActionState(submitEstimate, INITIAL);

  if (state.status === "success") {
    return (
      <div className="rounded-[16px] border border-ok bg-s1 p-6 text-center md:p-8">
        <div
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full border-[1.5px] border-ok text-2xl text-ok"
        >
          &#10003;
        </div>
        <p className="mt-4 text-xl font-medium">So&apos;rov yuborildi</p>
        <p className="mt-2 text-[14.5px] leading-[1.7] text-ts">
          Hisob raqami <span className="font-mono text-accent-text">{publicId}</span> bilan
          keldi — hammasi ko&apos;rinib turibdi, qaytadan tushuntirish kerak emas. Bir ish kuni
          ichida javob beraman.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="rounded-[16px] border border-line bg-s1 p-6 md:p-8">
      <input type="hidden" name="publicId" value={publicId} />
      <p className="label text-[10px]">Loyihani boshlash</p>
      <p className="mt-2 text-[14px] leading-[1.7] text-ts">
        Bu hisob so&apos;rovga biriktiriladi — konfiguratsiyani qaytadan tushuntirishingiz shart
        emas.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div>
          <label htmlFor="est-name" className="label text-[10px]">
            Ismingiz
          </label>
          <input
            id="est-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Ilyos"
            aria-invalid={Boolean(state.errors?.name)}
            className={`mt-2 ${inputCls} ${state.errors?.name ? "border-bad" : ""}`}
          />
          {state.errors?.name && <p className="mt-2 text-[13px] text-bad">{state.errors.name}</p>}
        </div>

        <div>
          <label htmlFor="est-email" className="label text-[10px]">
            Email
          </label>
          <input
            id="est-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="siz@kompaniya.com"
            aria-invalid={Boolean(state.errors?.email)}
            className={`mt-2 ${inputCls} ${state.errors?.email ? "border-bad" : ""}`}
          />
          {state.errors?.email && <p className="mt-2 text-[13px] text-bad">{state.errors.email}</p>}
        </div>

        <div>
          <label htmlFor="est-phone" className="label text-[10px]">
            Telefon
          </label>
          <input
            id="est-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="Ixtiyoriy"
            className={`mt-2 ${inputCls}`}
          />
        </div>

        <div>
          <label htmlFor="est-company" className="label text-[10px]">
            Kompaniya
          </label>
          <input
            id="est-company"
            name="company"
            autoComplete="organization"
            placeholder="Ixtiyoriy"
            className={`mt-2 ${inputCls}`}
          />
        </div>
      </div>

      {/* Honeypot: off-screen rather than display:none so bots that check
          computed styles still fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="est-website">Veb-sayt</label>
        <input id="est-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message && (
        <p role="alert" className="mt-4 text-[13px] text-bad">
          {state.message}
        </p>
      )}

      <Submit />
      <p className="mt-3 text-[12.5px] leading-[1.6] text-tt">
        To&apos;lov talab qilinmaydi. Bu shunchaki suhbatni ochadi.
      </p>
    </form>
  );
}
