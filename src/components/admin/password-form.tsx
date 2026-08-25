"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  changeAdminPassword,
  type ChangePasswordState,
} from "@/lib/actions/auth";
import { Field, inputCls } from "./ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-medium text-tp transition-colors hover:bg-accent-hover disabled:bg-s3 disabled:text-td"
    >
      {pending ? "Almashtirilmoqda…" : "Parolni almashtirish"}
    </button>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<ChangePasswordState, FormData>(
    changeAdminPassword,
    {},
  );

  return (
    <form action={action} className="rounded-[16px] border border-line bg-s1 p-5 md:p-6">
      <h2 className="label text-[10px]">Admin xavfsizligi</h2>
      <p className="mt-1.5 max-w-2xl text-xs leading-[1.6] text-tt">
        Parol almashtirilgach barcha eski sessiyalar bekor qilinadi va qayta kirish so&apos;raladi.
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Field
          label="Amaldagi parol"
          htmlFor="currentPassword"
          error={state.fieldErrors?.currentPassword}
        >
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputCls}
          />
        </Field>
        <Field
          label="Yangi parol"
          htmlFor="newPassword"
          hint="Kamida 14 belgi, katta-kichik harf, raqam va maxsus belgi"
          error={state.fieldErrors?.newPassword}
        >
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={14}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
        <Field
          label="Yangi parolni takrorlang"
          htmlFor="confirmPassword"
          error={state.fieldErrors?.confirmPassword}
        >
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={14}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
      </div>

      {state.error && (
        <p className="mt-4 text-sm text-bad" role="alert">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}

