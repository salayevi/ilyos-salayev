"use client";

import { useMemo, useState } from "react";

import { formatMoneyExact as money } from "@/lib/format";

import {
  blockedBy,
  calculate,
  type PriceGroup,
  type PriceOption,
  type PriceService,
  type Selections,
} from "@/lib/pricing/engine";
import { matchingPreset, PRESETS } from "@/lib/pricing/presets";



/**
 * The project configurator.
 *
 * The engine is a pure function, so the same `calculate` that will recompute
 * this on the server when it is saved also runs here on every click. That is
 * what makes the price feel instant without a request per checkbox, and it
 * removes the class of bug where the number on screen and the number stored
 * disagree — there is only one implementation to disagree with.
 *
 * The browser's answer is never trusted. It is a preview; the figure that ends
 * up in an estimate is computed again server-side from the same rows.
 */
export function Calculator({
  service,
  groups,
  options,
  saveAction,
}: {
  service: PriceService & { name: string; includes: string[] };
  groups: PriceGroup[];
  options: PriceOption[];
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const [selections, setSelections] = useState<Selections>({});
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");

  // The summary sits one past the last question rather than being a group of
  // its own, so adding a step to the database never has to know about it.
  const lastStep = groups.length;
  const group = groups[step];

  const estimate = useMemo(
    () => calculate(service, groups, options, selections),
    [service, groups, options, selections],
  );

  const flatSelected = useMemo(() => {
    const out: string[] = [];
    for (const value of Object.values(selections)) {
      if (Array.isArray(value)) out.push(...value);
      else if (value) out.push(value);
    }
    return out;
  }, [selections]);

  const blocked = useMemo(() => blockedBy(options, flatSelected), [options, flatSelected]);
  const activePreset = useMemo(
    () => matchingPreset(selections, groups.map((g) => g.key)),
    [selections, groups],
  );

  const choose = (groupKey: string, optionKey: string, multi: boolean) => {
    setSelections((prev) => {
      if (!multi) return { ...prev, [groupKey]: optionKey };
      const current = Array.isArray(prev[groupKey]) ? (prev[groupKey] as string[]) : [];
      return {
        ...prev,
        [groupKey]: current.includes(optionKey)
          ? current.filter((k) => k !== optionKey)
          : [...current, optionKey],
      };
    });
  };

  const isPicked = (groupKey: string, optionKey: string) => {
    const value = selections[groupKey];
    return Array.isArray(value) ? value.includes(optionKey) : value === optionKey;
  };

  const answered = (g: PriceGroup) => {
    const value = selections[g.key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  };

  const canAdvance = !group || !group.required || answered(group);

  /* ------------------------------------------------------------ summary */
  const Summary = (
    <div className="flex flex-col gap-5">
      <div>
        <p className="label text-[10px]">Taxminiy narx</p>
        {estimate.isRange ? (
          <>
            <p className="mt-2 font-display text-[34px] leading-none tracking-[-0.02em] md:text-[42px]">
              {money(estimate.rangeLow, estimate.currency)} –{" "}
              {money(estimate.rangeHigh, estimate.currency)}
            </p>
            <p className="mt-2 text-[13px] leading-[1.55] text-tt">
              Tanlovlaringiz orasida formadan aniq narxlab bo&apos;lmaydigan qism bor. Yakuniy
              raqam loyihani ko&apos;rib chiqqandan keyin beriladi.
            </p>
          </>
        ) : (
          <p className="mt-2 font-display text-[40px] leading-none tracking-[-0.02em] md:text-[52px]">
            {money(estimate.oneTime, estimate.currency)}
          </p>
        )}
        <p className="mt-1.5 text-[13px] text-tt">Bir martalik ishlab chiqish</p>
      </div>

      {(estimate.monthly > 0 || estimate.externalMax > 0) && (
        <dl className="flex flex-col gap-2.5 border-t border-line pt-4">
          {estimate.monthly > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[13px] text-ts">Oylik parvarish</dt>
              <dd className="font-mono text-[13px] text-tp">
                {money(estimate.monthly, estimate.currency)}/oy
              </dd>
            </div>
          )}
          {estimate.externalMax > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[13px] text-ts">
                Tashqi xizmatlar
                <span className="mt-0.5 block text-[11px] text-tm">Meniki emas — to&apos;g&apos;ridan-to&apos;g&apos;ri to&apos;laysiz</span>
              </dt>
              <dd className="shrink-0 font-mono text-[13px] text-tp">
                ~{money(estimate.externalMin, estimate.currency)}–
                {money(estimate.externalMax, estimate.currency)}/oy
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
        <span className="text-[13px] text-ts">Taxminiy muddat</span>
        <span className="font-mono text-[13px] text-tp">
          {estimate.weeksMin}–{estimate.weeksMax} hafta
        </span>
      </div>

      {/* The breakdown is the whole point: a total nobody can take apart is a
          number to argue with rather than a quote to accept. */}
      {estimate.lines.length > 0 && (
        <details className="group border-t border-line pt-4" open>
          <summary className="label flex cursor-pointer list-none items-center gap-2 text-[10px] [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="text-accent-text transition-transform group-open:rotate-45">
              +
            </span>
            Nimadan tashkil topgan
          </summary>
          <ul className="mt-3 flex flex-col gap-1.5">
            <li className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-tt">{service.name} — baza</span>
              <span className="shrink-0 font-mono text-ts">
                {money(estimate.base, estimate.currency)}
              </span>
            </li>
            {estimate.hitMinimum && (
              <li className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-tt">Minimal loyiha narxi</span>
                <span className="shrink-0 font-mono text-ts">
                  {money(service.minimumPrice, estimate.currency)}
                </span>
              </li>
            )}
            {estimate.lines.map((line) => (
              <li
                key={line.groupKey + line.optionKey}
                className="flex items-baseline justify-between gap-3 text-[13px]"
              >
                <span className="text-tt">
                  {line.label}
                  {line.auto && (
                    <span className="ml-1.5 font-mono text-[10px] text-accent-text">avto</span>
                  )}
                  {line.factor && (
                    <span className="ml-1.5 font-mono text-[10px] text-tm">×{line.factor}</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-ts">
                  {line.amount > 0 ? `+${money(line.amount, estimate.currency)}` : ""}
                  {line.monthly > 0 && (
                    <span className="text-tm">
                      {line.amount > 0 ? " · " : ""}
                      {money(line.monthly, estimate.currency)}/oy
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );

  /* ------------------------------------------------------------- render */
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
      <div className="min-w-0">
        {/* presets */}
        <div className="rounded-[16px] border border-line bg-s1 p-5 md:p-6">
          <p className="label text-[10px]">Tez boshlash</p>
          <p className="mt-2 text-[13px] leading-[1.6] text-tt">
            Tipik konfiguratsiyani bir bosishda to&apos;ldiring, keyin o&apos;zingizga moslang.
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {PRESETS.map((preset) => {
              const on = activePreset?.tier === preset.tier;
              return (
                <button
                  key={preset.tier}
                  type="button"
                  onClick={() => setSelections({ ...preset.selections })}
                  aria-pressed={on}
                  className={`rounded-[12px] border p-3.5 text-left transition-colors ${
                    on
                      ? "border-line-accent bg-crimson-900/40"
                      : "border-line-2 hover:border-line-3 hover:bg-s2"
                  }`}
                >
                  <span className="block font-display text-xl leading-none">{preset.name}</span>
                  <span className="label mt-1.5 block text-[9px]">{preset.positioning}</span>
                  <span className="mt-2 block text-[12px] leading-[1.5] text-tt">
                    {preset.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* progress */}
        <ol className="mt-6 flex flex-wrap gap-1.5" aria-label="Bosqichlar">
          {groups.map((g, i) => (
            <li key={g.key}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${
                  i === step
                    ? "border-line-accent bg-accent text-tp"
                    : answered(g)
                      ? "border-line-3 text-accent-text"
                      : "border-line-2 text-tt hover:text-tp"
                }`}
              >
                {String(i + 1).padStart(2, "0")} {g.label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setStep(lastStep)}
              aria-current={step === lastStep ? "step" : undefined}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${
                step === lastStep
                  ? "border-line-accent bg-accent text-tp"
                  : "border-line-2 text-tt hover:text-tp"
              }`}
            >
              Xulosa
            </button>
          </li>
        </ol>

        {/* current step */}
        <div className="mt-5 rounded-[16px] border border-line bg-s1 p-5 md:mt-6 md:p-8">
          {group ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-accent-text">
                  {String(step + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-[26px] leading-none tracking-[-0.02em] md:text-[32px]">
                  {group.label}
                </h2>
                {!group.required && (
                  <span className="label text-[9px]">ixtiyoriy</span>
                )}
              </div>
              {group.help && <p className="mt-2.5 text-[14px] text-ts">{group.help}</p>}

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {options
                  .filter((o) => o.groupKey === group.key)
                  .map((option) => {
                    const picked = isPicked(group.key, option.key);
                    const blockedByLabel = blocked.get(option.key);
                    const disabled = Boolean(blockedByLabel) && !picked;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => choose(group.key, option.key, group.select === "many")}
                        aria-pressed={picked}
                        className={`rounded-[12px] border p-3.5 text-left transition-colors ${
                          picked
                            ? "border-line-accent bg-crimson-900/40"
                            : disabled
                              ? "cursor-not-allowed border-line text-td"
                              : "border-line-2 hover:border-line-3 hover:bg-s2"
                        }`}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className={`text-[15px] font-medium ${disabled ? "text-td" : ""}`}>
                            {option.label}
                          </span>
                          {option.mode === "multiplier" ? (
                            <span className="shrink-0 font-mono text-[11px] text-tt">
                              ×{(option.amount / 10_000).toFixed(2)}
                            </span>
                          ) : option.amount > 0 ? (
                            <span className="shrink-0 font-mono text-[11px] text-tt">
                              +{money(option.amount, estimate.currency)}
                            </span>
                          ) : option.monthly > 0 ? (
                            <span className="shrink-0 font-mono text-[11px] text-tt">
                              {money(option.monthly, estimate.currency)}/oy
                            </span>
                          ) : null}
                        </span>
                        {option.description && (
                          <span className="mt-1.5 block text-[12.5px] leading-[1.55] text-tt">
                            {option.description}
                          </span>
                        )}
                        {/* A disabled control with no reason attached reads as a
                            bug. The reason is the whole value of blocking it. */}
                        {disabled && (
                          <span className="mt-2 block font-mono text-[10px] text-accent-text">
                            &laquo;{blockedByLabel}&raquo; bilan birga tanlanmaydi
                          </span>
                        )}
                        {option.needsReview && (
                          <span className="mt-2 block font-mono text-[10px] text-warn">
                            narx ko&apos;rib chiqishdan keyin aniqlanadi
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {estimate.autoAdded.length > 0 && step < lastStep && (
                <p className="mt-4 rounded-lg border border-line-3 bg-crimson-900/25 p-3 text-[12.5px] leading-[1.6] text-ts">
                  Tanlovingiz uchun zarur qismlar o&apos;zi qo&apos;shildi:{" "}
                  {estimate.autoAdded
                    .map((k) => options.find((o) => o.key === k)?.label ?? k)
                    .join(", ")}
                  . Ular narxda alohida ko&apos;rsatilgan.
                </p>
              )}
            </>
          ) : (
            <SummaryStep
              service={service}
              groups={groups}
              options={options}
              selections={selections}
              estimate={estimate}
              idea={idea}
              setIdea={setIdea}
              saveAction={saveAction}
            />
          )}

          {/* nav */}
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex h-11 items-center rounded-lg border border-line-2 px-5 text-sm transition-colors hover:border-line-3 hover:bg-s2 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Orqaga
            </button>
            {step < lastStep && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(lastStep, s + 1))}
                disabled={!canAdvance}
                className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-medium text-tp transition-colors hover:bg-accent-hover disabled:bg-s3 disabled:text-td"
              >
                {step === lastStep - 1 ? "Xulosaga o'tish" : "Keyingisi"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* desktop summary */}
      <aside className="mt-6 hidden lg:sticky lg:top-24 lg:mt-0 lg:block">
        <div className="rounded-[16px] border border-line-3 bg-s1 p-5">{Summary}</div>
      </aside>

      {/* mobile summary — a sticky bar rather than a panel, because on a phone
          the price has to stay visible while the options are being tapped. */}
      <div className="sticky bottom-0 z-30 mt-5 lg:hidden">
        <details className="glass rounded-t-[16px] border border-line-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="label block text-[9px]">Taxminiy narx</span>
              <span className="mt-0.5 block font-display text-[26px] leading-none">
                {estimate.isRange
                  ? `${money(estimate.rangeLow, estimate.currency)}–${money(estimate.rangeHigh, estimate.currency)}`
                  : money(estimate.oneTime, estimate.currency)}
              </span>
            </span>
            <span className="font-mono text-[11px] text-accent-text">batafsil</span>
          </summary>
          <div className="max-h-[55vh] overflow-y-auto border-t border-line p-4">{Summary}</div>
        </details>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- summary step */

function SummaryStep({
  service,
  groups,
  options,
  selections,
  estimate,
  idea,
  setIdea,
  saveAction,
}: {
  service: PriceService & { name: string; includes: string[] };
  groups: PriceGroup[];
  options: PriceOption[];
  selections: Selections;
  estimate: ReturnType<typeof calculate>;
  idea: string;
  setIdea: (v: string) => void;
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const byKey = new Map(options.map((o) => [o.key, o]));

  return (
    <>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-accent-text">
          {String(groups.length + 1).padStart(2, "0")}
        </span>
        <h2 className="font-display text-[26px] leading-none tracking-[-0.02em] md:text-[32px]">
          Xulosa
        </h2>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="label text-[9px]">Loyiha</dt>
          <dd className="mt-1 text-[15px]">{service.name}</dd>
        </div>
        {groups.map((group) => {
          const value = selections[group.key];
          const keys = value === undefined ? [] : Array.isArray(value) ? value : [value];
          if (keys.length === 0) return null;
          return (
            <div key={group.key}>
              <dt className="label text-[9px]">{group.label}</dt>
              <dd className="mt-1 text-[15px]">
                {keys.map((k) => byKey.get(k)?.label ?? k).join(", ")}
              </dd>
            </div>
          );
        })}
      </dl>

      {service.includes.length > 0 && (
        <div className="mt-6 rounded-lg border border-line bg-s2 p-4">
          <p className="label text-[9px]">Har doim kiradi</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {service.includes.map((item) => (
              <li key={item} className="text-[13px] text-ts">
                <span aria-hidden className="mr-1.5 text-accent-text">
                  &mdash;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={saveAction} className="mt-6">
        <input type="hidden" name="service" value={service.slug} />
        <input type="hidden" name="selections" value={JSON.stringify(selections)} />

        <label htmlFor="idea" className="label text-[10px]">
          G&apos;oyangizni yozib qo&apos;ying
        </label>
        <p className="mt-1.5 text-[12.5px] leading-[1.6] text-tt">
          Belgilab bo&apos;lmagan narsalar shu yerga. Bu matn narxni o&apos;zgartirmaydi — uni
          men o&apos;qiyman.
        </p>
        <textarea
          id="idea"
          name="idea"
          rows={4}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Masalan: restoranlar uchun buyurtma va yetkazib berish platformasi…"
          className="mt-2.5 w-full rounded-lg border border-line-2 bg-s2 p-4 text-[15px] leading-[1.6] text-tp placeholder:text-tt focus:border-accent focus:outline-none"
        />

        <button
          type="submit"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-7 text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover sm:w-auto"
        >
          Hisobni saqlash va davom etish
        </button>
        <p className="mt-3 text-[12.5px] leading-[1.6] text-tt">
          Saqlanganda unikal raqam beriladi. Bu hali buyurtma emas va hech qanday to&apos;lov
          talab qilmaydi.
        </p>
      </form>

      {estimate.dropped.length > 0 && (
        <p className="mt-4 rounded-lg border border-warn/40 bg-warn-bg p-3 text-[12.5px] leading-[1.6] text-ts">
          Ba&apos;zi tanlovlar bir-biriga zid bo&apos;lgani uchun hisobga olinmadi:{" "}
          {estimate.dropped.map((d) => byKey.get(d.key)?.label ?? d.key).join(", ")}.
        </p>
      )}
    </>
  );
}
