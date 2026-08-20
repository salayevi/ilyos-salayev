"use client";

import { useFormStatus } from "react-dom";

export const inputCls =
  "h-11 w-full rounded-lg border border-line-2 bg-s2 px-3.5 text-[15px] text-tp placeholder:text-tt focus:border-accent focus:outline-none";

export const areaCls =
  "w-full rounded-lg border border-line-2 bg-s2 p-3.5 text-[15px] leading-[1.6] text-tp placeholder:text-tt focus:border-accent focus:outline-none";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label text-[10px]">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && !error && <p className="mt-1.5 text-xs text-tt">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-2 bg-s2 px-3.5 py-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-[var(--color-crimson)]"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function SaveBar({ ok, error }: { ok?: boolean; error?: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 -mx-4 mt-8 flex items-center gap-4 border-t border-line bg-void/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-medium text-tp transition-colors hover:bg-accent-hover disabled:bg-s3 disabled:text-td"
      >
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </button>
      {ok && !pending && (
        <span className="text-sm text-ok" role="status">
          Saqlandi
        </span>
      )}
      {error && !pending && (
        <span className="text-sm text-bad" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function DangerButton({ children, ...rest }: React.ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      disabled={pending}
      className="inline-flex h-11 items-center rounded-lg border border-bad/40 px-5 text-sm font-medium text-bad transition-colors hover:bg-bad-bg disabled:opacity-50"
    >
      {children}
    </button>
  );
}
