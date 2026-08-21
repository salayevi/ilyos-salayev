"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  confirmTelegramOrder,
  placeOrder,
  type OrderState,
  type TelegramConfirmState,
} from "@/lib/actions/orders";

// Lives here rather than beside the action: a "use server" module may export
// only async functions, and a plain object there fails at request time.
const INITIAL: OrderState = { status: "idle" };
const TELEGRAM_INITIAL: TelegramConfirmState = {};

/**
 * Books a service tariff or requests a ready-made site.
 *
 * Only `kind` and `itemId` are posted for the subject of the order — the title
 * and the amount are re-read from the database inside the action, so a tampered
 * hidden price field buys nothing.
 */
export function OrderForm({
  kind,
  itemId,
  itemTitle,
  priceLine,
  submitLabel,
}: {
  kind: "service" | "product";
  itemId: number;
  itemTitle: string;
  priceLine?: string | null;
  submitLabel: string;
}) {
  const [state, action] = useActionState(placeOrder, INITIAL);
  const [telegramState, telegramAction] = useActionState(confirmTelegramOrder, TELEGRAM_INITIAL);

  if (state.status === "success") {
    return (
      <div className="rounded-[16px] border border-ok bg-s1 p-6 text-center md:p-8">
        <div
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full border-[1.5px] border-ok text-xl text-ok"
        >
          &#10003;
        </div>
        <p className="mt-4 text-xl font-medium">So&apos;rov qabul qilindi</p>
        <p className="mt-2 text-[15px] leading-[1.7] text-ts">
          {kind === "product"
            ? "Davom etish uchun tayyor xabarni Telegram orqali yuboring."
            : "Tayyor xabarni Telegram orqali yuboring — bir ish kuni ichida javob beraman."}
        </p>
        {state.telegramUrl ? (
          <a
            href={state.telegramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-tp transition-colors hover:bg-accent-hover"
          >
            Telegramda xabarni ochish &rarr;
          </a>
        ) : (
          <p className="mt-4 text-[13px] text-warn">
            Telegram qabul qiluvchisi hali sozlanmagan. Iltimos, email orqali bog&apos;laning.
          </p>
        )}
        {state.orderId && state.confirmationToken && state.telegramUrl && (
          <form action={telegramAction} className="mt-3">
            <input type="hidden" name="orderId" value={state.orderId} />
            <input type="hidden" name="confirmationToken" value={state.confirmationToken} />
            <button
              type="submit"
              className="text-[13px] text-ts underline decoration-line-3 underline-offset-4 transition-colors hover:text-tp"
            >
              Xabarni yubordim
            </button>
            {telegramState.ok && <span className="ml-2 text-[13px] text-ok">Tasdiqlandi</span>}
            {telegramState.error && <span className="ml-2 text-[13px] text-bad">{telegramState.error}</span>}
          </form>
        )}
      </div>
    );
  }

  const inputCls =
    "h-12 w-full rounded-lg border border-line-2 bg-s2 px-4 text-[15px] text-tp placeholder:text-tt focus:border-accent focus:outline-none";

  return (
    <form action={action} noValidate className="rounded-[16px] border border-line bg-s1 p-5 md:p-7">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="itemId" value={itemId} />

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
        <p className="text-[17px] font-medium">{itemTitle}</p>
        {priceLine && <p className="font-mono text-sm text-accent-text">{priceLine}</p>}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <OrderField id="order-name" label="Ismingiz" error={state.errors?.name}>
          <input
            id="order-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Ilyos"
            aria-invalid={Boolean(state.errors?.name)}
            className={`${inputCls} ${state.errors?.name ? "border-bad" : ""}`}
          />
        </OrderField>

        <OrderField id="order-email" label="Email" error={state.errors?.email}>
          <input
            id="order-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="siz@kompaniya.com"
            aria-invalid={Boolean(state.errors?.email)}
            className={`${inputCls} ${state.errors?.email ? "border-bad" : ""}`}
          />
        </OrderField>

        <OrderField id="order-phone" label="Telefon" error={state.errors?.phone}>
          <input
            id="order-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+998 90 000 00 00"
            className={inputCls}
          />
        </OrderField>

        <OrderField id="order-start" label={kind === "product" ? "To'lov usuli" : "Qachon boshlaymiz"}>
          <input
            id="order-start"
            name="preferredStart"
            placeholder={kind === "product" ? "Payme · Click · bank" : "Kelasi oy"}
            className={inputCls}
          />
        </OrderField>
      </div>

      <div className="mt-4">
        <OrderField id="order-brief" label="Izoh" error={state.errors?.brief}>
          <textarea
            id="order-brief"
            name="brief"
            rows={4}
            placeholder={
              kind === "product"
                ? "Domen, kontent yoki o'zgartirish bo'yicha talablaringiz"
                : "Nima qurmoqchisiz va qachonga kerak?"
            }
            className="w-full rounded-lg border border-line-2 bg-s2 p-4 text-[15px] leading-[1.6] text-tp placeholder:text-tt focus:border-accent focus:outline-none"
          />
        </OrderField>
      </div>

      {/* Honeypot: off-screen rather than display:none so bots that check
          computed styles still fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="order-website">Veb-sayt</label>
        <input id="order-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message && (
        <p role="alert" className="mt-4 text-[13px] text-bad">
          {state.message}
        </p>
      )}

      <Submit label={submitLabel} />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 flex h-12.5 w-full items-center justify-center rounded-lg bg-accent text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover disabled:bg-s3 disabled:text-td"
    >
      {pending ? "Yuborilmoqda…" : label}
    </button>
  );
}

function OrderField({
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
        <p className="mt-2 text-[13px] text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
