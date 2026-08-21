import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatMoneyExact as money } from "@/lib/format";
import { getCatalogService, getEstimate, getPricingConfig } from "@/lib/queries";

/**
 * A saved estimate.
 *
 * Never indexed. The reference is unguessable precisely so the page can carry
 * someone's budget and scope, and a crawler holding one would defeat that.
 */
export const metadata: Metadata = {
  title: "Saqlangan hisob",
  robots: { index: false, follow: false },
};



export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estimate = await getEstimate(id);
  if (!estimate) notFound();

  const [service, config] = await Promise.all([
    getCatalogService(estimate.serviceSlug),
    getPricingConfig(),
  ]);

  const optionLabel = new Map(config.options.map((o) => [o.key, o.label]));
  const groupLabel = new Map(config.groups.map((g) => [g.key, g.label]));

  return (
    <section className="mx-auto max-w-[860px] px-5 pt-9 pb-16 md:px-10 md:pt-24 md:pb-28">
      <p className="label text-[10px]">Saqlangan hisob</p>
      <h1 className="mt-3 font-mono text-[26px] tracking-[0.02em] text-accent-text md:text-[32px]">
        {estimate.publicId}
      </h1>
      <p className="mt-3 text-[15px] leading-[1.7] text-ts">
        Bu havolani saqlab qo&apos;ying — hisob shu manzilda turadi. Narxlar keyin
        o&apos;zgarsa ham, bu sahifadagi raqamlar o&apos;zgarmaydi.
      </p>

      <div className="mt-8 rounded-[16px] border border-line-3 bg-s1 p-6 md:p-8">
        <p className="label text-[10px]">{service?.name ?? estimate.serviceSlug}</p>

        {estimate.isRange ? (
          <>
            <p className="mt-3 font-display text-[34px] leading-none tracking-[-0.02em] md:text-[46px]">
              {money(estimate.rangeLow, estimate.currency)} –{" "}
              {money(estimate.rangeHigh, estimate.currency)}
            </p>
            <p className="mt-2.5 text-[13.5px] leading-[1.6] text-tt">
              Tanlovlar orasida formadan aniq narxlab bo&apos;lmaydigan qism bor. Yakuniy raqam
              loyihani ko&apos;rib chiqqandan keyin beriladi.
            </p>
          </>
        ) : (
          <p className="mt-3 font-display text-[40px] leading-none tracking-[-0.02em] md:text-[54px]">
            {money(estimate.oneTime, estimate.currency)}
          </p>
        )}
        <p className="mt-1.5 text-[13px] text-tt">Bir martalik ishlab chiqish</p>

        <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
          {estimate.monthly > 0 && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[14px] text-ts">Oylik parvarish</dt>
              <dd className="font-mono text-[14px]">
                {money(estimate.monthly, estimate.currency)}/oy
              </dd>
            </div>
          )}
          {estimate.externalMax > 0 && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[14px] text-ts">
                Tashqi xizmatlar
                <span className="mt-0.5 block text-[11.5px] text-tm">
                  Meniki emas — to&apos;g&apos;ridan-to&apos;g&apos;ri to&apos;laysiz
                </span>
              </dt>
              <dd className="shrink-0 font-mono text-[14px]">
                ~{money(estimate.externalMin, estimate.currency)}–
                {money(estimate.externalMax, estimate.currency)}/oy
              </dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[14px] text-ts">Taxminiy muddat</dt>
            <dd className="font-mono text-[14px]">
              {estimate.weeksMin}–{estimate.weeksMax} hafta
            </dd>
          </div>
        </dl>
      </div>

      {estimate.breakdown.length > 0 && (
        <div className="mt-6 rounded-[16px] border border-line bg-s1 p-6 md:p-8">
          <p className="label text-[10px]">Nimadan tashkil topgan</p>
          <ul className="mt-4 flex flex-col gap-2">
            {estimate.breakdown.map((line) => (
              <li
                key={line.groupKey + line.optionKey}
                className="flex items-baseline justify-between gap-4 border-b border-line pb-2 text-[14px] last:border-0"
              >
                <span className="text-ts">
                  {line.label}
                  {line.auto && (
                    <span className="ml-2 font-mono text-[10px] text-accent-text">avto</span>
                  )}
                  {line.factor && (
                    <span className="ml-2 font-mono text-[10px] text-tm">×{line.factor}</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-[13px]">
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
        </div>
      )}

      <div className="mt-6 rounded-[16px] border border-line bg-s1 p-6 md:p-8">
        <p className="label text-[10px]">Konfiguratsiya</p>
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {Object.entries(estimate.selections).map(([groupKey, value]) => {
            const keys = Array.isArray(value) ? value : [value];
            if (keys.length === 0) return null;
            return (
              <div key={groupKey}>
                <dt className="label text-[9px]">{groupLabel.get(groupKey) ?? groupKey}</dt>
                <dd className="mt-1 text-[14px] text-ts">
                  {keys.map((k) => optionLabel.get(k) ?? k).join(", ")}
                </dd>
              </div>
            );
          })}
        </dl>
        {estimate.idea && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="label text-[9px]">Sizning izohingiz</p>
            <p className="mt-2 text-[14px] leading-[1.7] whitespace-pre-wrap text-ts">
              {estimate.idea}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/contact?hisob=${estimate.publicId}`}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-7 text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover"
        >
          Loyihani boshlash
        </Link>
        <Link
          href={`/pricing/${estimate.serviceSlug}`}
          className="inline-flex h-12 items-center justify-center rounded-lg border border-line-2 px-7 text-[15px] font-medium transition-colors hover:border-line-3 hover:bg-s2"
        >
          Qaytadan hisoblash
        </Link>
      </div>

      <p className="mt-5 text-[13px] leading-[1.7] text-tt">
        Bu hali buyurtma emas va hech qanday to&apos;lov talab qilmaydi. &laquo;Loyihani
        boshlash&raquo; tugmasi shunchaki suhbatni ochadi — hisob raqami so&apos;rovga
        biriktiriladi.
      </p>
    </section>
  );
}
