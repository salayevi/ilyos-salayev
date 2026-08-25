import Link from "next/link";

import { deleteEstimate, saveEstimateNotes, setEstimateStatus } from "@/lib/actions/admin";
import { formatMoneyExact as money } from "@/lib/format";
import { ESTIMATE_STAGES, getCatalog, getEstimates, getPricingConfig } from "@/lib/queries";

const TONE: Record<string, string> = {
  neutral: "border-line-2 text-ts",
  info: "border-info/40 bg-info-bg text-info",
  warn: "border-warn/40 bg-warn-bg text-warn",
  ok: "border-ok/40 bg-ok-bg text-ok",
  bad: "border-bad/40 bg-bad-bg text-bad",
};

const pill = "inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] transition-colors";

/**
 * What visitors priced, and who asked.
 *
 * Every estimate is here, including the ones nobody sent. An abandoned
 * configuration is not a lead, but it is the most honest signal available about
 * what the catalogue is being asked for — three drafts stopping at the same
 * step says more about that step than any analytics event.
 */
export default async function AdminEstimates() {
  const [estimates, catalog, config] = await Promise.all([
    getEstimates(),
    getCatalog(),
    getPricingConfig(),
  ]);

  const serviceName = new Map(catalog.map((s) => [s.slug, s.name]));
  const optionLabel = new Map(config.options.map((o) => [o.key, o.label]));
  const groupLabel = new Map(config.groups.map((g) => [g.key, g.label]));
  const stageOf = (v: string) =>
    ESTIMATE_STAGES.find((s) => s.value === v) ?? ESTIMATE_STAGES[0];

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Hisoblar</h1>
        <Link
          href="/pricing"
          target="_blank"
          className={`${pill} border-line-2 text-ts hover:border-line-3 hover:text-tp`}
        >
          Kalkulyatorni ochish
        </Link>
      </header>

      {estimates.length === 0 ? (
        <p className="mt-10 text-sm text-tt">
          Hozircha hisob yo&apos;q. Kalkulyatorda loyiha sozlangan zahoti shu yerda paydo
          bo&apos;ladi.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3 md:mt-8">
          {estimates.map((e) => {
            const stage = stageOf(e.status);
            const draft = e.status === "draft";
            return (
              <li
                key={e.id}
                className={`rounded-[12px] border bg-s1 p-4 md:p-5 ${
                  e.status === "submitted" ? "border-line-accent" : "border-line"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[13px] text-accent-text">{e.publicId}</span>
                    <span className="text-[15px] font-medium">
                      {serviceName.get(e.serviceSlug) ?? e.serviceSlug}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${TONE[stage.tone]}`}
                    >
                      {stage.label}
                    </span>
                    <span className="font-mono text-xs text-tt">
                      {e.createdAt.toLocaleString("uz-UZ")}
                    </span>
                  </div>
                </div>

                {/* Money first — it is the reason to open the row at all. */}
                <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <span className="font-display text-[26px] leading-none">
                    {e.isRange
                      ? `${money(e.rangeLow, e.currency)} – ${money(e.rangeHigh, e.currency)}`
                      : money(e.oneTime, e.currency)}
                  </span>
                  {e.monthly > 0 && (
                    <span className="font-mono text-[12px] text-ts">
                      {money(e.monthly, e.currency)}/oy
                    </span>
                  )}
                  {e.externalMax > 0 && (
                    <span className="font-mono text-[12px] text-tt">
                      tashqi ~{money(e.externalMin, e.currency)}–{money(e.externalMax, e.currency)}/oy
                    </span>
                  )}
                  <span className="font-mono text-[12px] text-tt">
                    {e.weeksMin}–{e.weeksMax} hafta
                  </span>
                </div>

                {draft ? (
                  <p className="mt-3 text-[13.5px] text-tt">
                    Yuborilmagan — tashrifchi konfiguratsiyani sozlagan, lekin aloqa
                    ma&apos;lumotini qoldirmagan.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
                    <span className="font-medium">{e.name}</span>
                    {e.company && <span className="text-tt">{e.company}</span>}
                    <a href={`mailto:${e.email}`} className="text-accent-text hover:text-crimson-100">
                      {e.email}
                    </a>
                    {e.phone && (
                      <a href={`tel:${e.phone}`} className="text-accent-text hover:text-crimson-100">
                        {e.phone}
                      </a>
                    )}
                  </div>
                )}

                <details className="group mt-3">
                  <summary className="label flex cursor-pointer list-none items-center gap-2 text-[9px] [&::-webkit-details-marker]:hidden">
                    <span
                      aria-hidden
                      className="text-accent-text transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                    Konfiguratsiya va hisob
                  </summary>

                  <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-lg border border-line bg-s2 p-3.5 sm:grid-cols-3">
                    {Object.entries(e.selections).map(([groupKey, value]) => {
                      const keys = Array.isArray(value) ? value : [value];
                      if (keys.length === 0) return null;
                      return (
                        <div key={groupKey}>
                          <dt className="label text-[9px]">{groupLabel.get(groupKey) ?? groupKey}</dt>
                          <dd className="mt-0.5 text-[13px] text-ts">
                            {keys.map((k) => optionLabel.get(k) ?? k).join(", ")}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>

                  {e.breakdown.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1">
                      {e.breakdown.map((line) => (
                        <li
                          key={line.groupKey + line.optionKey}
                          className="flex items-baseline justify-between gap-4 text-[13px]"
                        >
                          <span className="text-tt">
                            {line.label}
                            {line.auto && (
                              <span className="ml-1.5 font-mono text-[10px] text-accent-text">
                                avto
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 font-mono text-ts">
                            {line.amount > 0 ? `+${money(line.amount, e.currency)}` : ""}
                            {line.monthly > 0 && ` ${money(line.monthly, e.currency)}/oy`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>

                {e.idea && (
                  <div className="mt-3 rounded-lg border border-line bg-s2 p-3.5">
                    <p className="label text-[9px]">Tashrifchining izohi</p>
                    <p className="mt-1.5 text-[14px] leading-[1.7] whitespace-pre-wrap text-ts">
                      {e.idea}
                    </p>
                  </div>
                )}

                <form action={saveEstimateNotes} className="mt-3">
                  <input type="hidden" name="id" value={e.id} />
                  <label htmlFor={`en-${e.id}`} className="label text-[9px]">
                    Ichki eslatma
                  </label>
                  <textarea
                    id={`en-${e.id}`}
                    name="notes"
                    rows={2}
                    defaultValue={e.notes}
                    placeholder="Suhbat natijasi, kelishilgan narx, keyingi qadam…"
                    className="mt-1.5 w-full rounded-lg border border-line-2 bg-s2 p-3 text-[14px] leading-[1.6] text-tp placeholder:text-tt focus:border-accent focus:outline-none"
                  />
                  <button type="submit" className={`${pill} mt-2 border-line-2 text-ts hover:text-tp`}>
                    Eslatmani saqlash
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <form action={setEstimateStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={e.id} />
                    <label htmlFor={`es-${e.id}`} className="label text-[9px]">
                      Bosqich
                    </label>
                    <select
                      id={`es-${e.id}`}
                      name="status"
                      defaultValue={e.status}
                      className="h-9 rounded-lg border border-line-2 bg-s2 px-2.5 text-[13px] text-tp focus:border-accent focus:outline-none"
                    >
                      {ESTIMATE_STAGES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={`${pill} border-line-2 text-ts hover:text-tp`}>
                      O&apos;zgartirish
                    </button>
                  </form>

                  <Link
                    href={`/hisob/${e.publicId}`}
                    target="_blank"
                    className={`${pill} border-line-2 text-ts hover:text-tp`}
                  >
                    Mijoz ko&apos;rinishi
                  </Link>

                  <form action={deleteEstimate}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className={`${pill} border-bad/40 text-bad hover:bg-bad-bg`}>
                      O&apos;chirish
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
