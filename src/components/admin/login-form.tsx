"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login, type LoginState } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-accent text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover disabled:bg-s3 disabled:text-td"
    >
      {pending ? "Tekshirilmoqda…" : "Kirish"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(login, {});

  const input =
    "mt-2 h-12 w-full rounded-lg border border-line-2 bg-s2 px-4 text-[15px] text-tp placeholder:text-tt focus:border-accent focus:outline-none";

  return (
    <form action={action} className="rounded-[16px] border border-line bg-s1 p-6">
      <div>
        <label htmlFor="email" className="label text-[10px]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue="salayevi782@gmail.com"
          className={input}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="password" className="label text-[10px]">
          Parol
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={input}
        />
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-[13px] text-bad">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
