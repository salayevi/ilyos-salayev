import Link from "next/link";

import type { PricingOption } from "@/db/schema";
import { saveCatalogPrices, savePricingOptions } from "@/lib/actions/admin";
import { getCatalog, getPricingRows } from "@/lib/queries";

const KIND_LABEL: Record<string, string> = {
  project: "Kalkulyator",
  fixed: "Belgilangan",
  retainer: "Oylik",
};

const num =
  "h-9 w-full rounded-lg border border-line-2 bg-s2 px-2.5 text-right font-mono text-[13px] text-tp focus:border-accent focus:outline-none";
const th = "label pb-2 text-[9px] font-normal";

/**
 * Where prices actually live.
 *
 * Nothing on this page is copy. Names, summaries and step structure are set in
 * the seed and changed in code, because renaming a service is a writing
 * decision made once a year, whereas a price is changed on a Tuesday afternoon
 * and needs to be two clicks away.
 */
export default async function AdminPricing() {
  const [catalog, rows] = await Promise.all([getCatalog(), getPricingRows()]);

  const byGroup = new Map<string, typeof rows.options>();
  for (const option of rows.options) {
    const list = byGroup.get(option.groupKey) ?? [];
    list.push(option);
    byGroup.set(option.groupKey, list);
  }

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Narxlar</h1>
        <Link
          href="/pricing"
          target="_blank"
          className="inline-flex h-9 items-center rounded-lg border border-line-2 px-3.5 text-[13px] text-ts transition-colors hover:border-line-3 hover:text-tp"
        >
          Saytda ko&apos;rish
        </Link>
      </header>

      <p className="mt-3 max-w-[70ch] text-[14px] leading-[1.7] text-ts">
        Bu yerdagi har bir raqam saytdagi kalkulyatorga darhol ta&apos;sir qiladi. Bazaviy narx —
        kalkulyator boshlanadigan nuqta; minimal narx — hech qanday tanlovda undan pastga
        tushmaydigan chegara.
      </p>

      {/* ---------------------------------------------------- catalogue */}
      <section className="mt-8">
        <h2 className="label text-[10px]">Xizmatlar</h2>
        <form action={saveCatalogPrices} className="mt-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-2">
                  <th className={th}>Xizmat</th>
                  <th className={`${th} w-[110px] text-right`}>Bazaviy</th>
                  <th className={`${th} w-[110px] text-right`}>Minimal</th>
                  <th className={`${th} w-[80px] text-right`}>Hafta min</th>
                  <th className={`${th} w-[80px] text-right`}>Hafta max</th>
                  <th className={`${th} w-[70px] text-center`}>Chop</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((s) => (
                  <tr key={s.id} className="border-b border-line">
                    <td className="py-2.5 pr-4">
                      <input type="hidden" name="id" value={s.id} />
                      <span className="text-[14px]">{s.name}</span>
                      <span className="ml-2 font-mono text-[10px] text-tt">
                        {KIND_LABEL[s.kind] ?? s.kind}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-td">{s.slug}</span>
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        name={`basePrice_${s.id}`}
                        defaultValue={s.basePrice}
                        min={0}
                        step={50}
                        className={num}
                        aria-label={`${s.name} bazaviy narx`}
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        name={`minimumPrice_${s.id}`}
                        defaultValue={s.minimumPrice}
                        min={0}
                        step={50}
                        className={num}
                        aria-label={`${s.name} minimal narx`}
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        name={`weeksMin_${s.id}`}
                        defaultValue={s.weeksMin}
                        min={0}
                        max={104}
                        className={num}
                        aria-label={`${s.name} eng kam hafta`}
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        name={`weeksMax_${s.id}`}
                        defaultValue={s.weeksMax}
                        min={0}
                        max={104}
                        className={num}
                        aria-label={`${s.name} eng ko'p hafta`}
                      />
                    </td>
                    <td className="py-2.5 text-center">
                      <input
                        type="checkbox"
                        name={`published_${s.id}`}
                        defaultChecked={s.published}
                        className="size-4 accent-[var(--color-crimson)]"
                        aria-label={`${s.name} chop etilgan`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-5 text-sm font-medium text-tp transition-colors hover:bg-accent-hover"
          >
            Xizmat narxlarini saqlash
          </button>
        </form>
      </section>

      {/* ------------------------------------------------------- options */}
      <section className="mt-12">
        <h2 className="label text-[10px]">Kalkulyator variantlari</h2>
        <p className="mt-2 max-w-[70ch] text-[13.5px] leading-[1.7] text-tt">
          Har bir qadam alohida saqlanadi. <span className="text-ts">Summa</span> — bir martalik
          qo&apos;shimcha; ko&apos;paytiruvchi variantlarda esa u bazis punkt (13500 = ×1.35).{" "}
          <span className="text-ts">Tashqi</span> — uchinchi tomon oladigan oylik to&apos;lov,
          sizga tushmaydi.
        </p>

        {rows.groups.map((group) => {
          const options = byGroup.get(group.key) ?? [];
          if (options.length === 0) return null;
          return (
            <form
              key={group.key}
              action={savePricingOptions}
              className="mt-6 rounded-[12px] border border-line bg-s1 p-4 md:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-[15px] font-medium">
                  {group.label}
                  <span className="ml-2 font-mono text-[10px] text-tt">{group.key}</span>
                </h3>
                <span className="font-mono text-[10px] text-tt">
                  {group.select === "many" ? "ko'p tanlanadi" : "bitta tanlanadi"}
                </span>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line-2">
                      <th className={th}>Variant</th>
                      <th className={`${th} w-[100px] text-right`}>Summa</th>
                      <th className={`${th} w-[90px] text-right`}>Oylik</th>
                      <th className={`${th} w-[90px] text-right`}>Tashqi min</th>
                      <th className={`${th} w-[90px] text-right`}>Tashqi max</th>
                      <th className={`${th} w-[70px] text-right`}>Hafta</th>
                      <th className={`${th} w-[60px] text-center`}>Faol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((o) => (
                      <OptionRow key={o.id} option={o} />
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                className="mt-3.5 inline-flex h-9 items-center rounded-lg border border-line-accent px-4 text-[13px] font-medium text-accent-text transition-colors hover:bg-crimson-900"
              >
                &laquo;{group.label}&raquo; saqlash
              </button>
            </form>
          );
        })}
      </section>

      <p className="mt-10 rounded-lg border border-warn/40 bg-warn-bg p-3.5 text-[13px] leading-[1.7] text-ts">
        Eski <Link href="/admin/services" className="underline">Xizmatlar</Link> ekrani hali
        turibdi, lekin uning ma&apos;lumoti saytda endi ko&apos;rsatilmaydi — u yerdagi narxlarni
        o&apos;zgartirish hech narsaga ta&apos;sir qilmaydi. Yozuvlar yo&apos;qolmasligi uchun
        o&apos;chirilmadi.
      </p>
    </>
  );
}

function OptionRow({ option }: { option: PricingOption }) {
  return (
    <tr className="border-b border-line">
      <td className="py-2 pr-4">
        <input type="hidden" name="id" value={option.id} />
        <span className="text-[13.5px]">{option.label}</span>
        {option.mode === "multiplier" && (
          <span className="ml-2 font-mono text-[10px] text-accent-text">
            ×{(option.amount / 10_000).toFixed(2)}
          </span>
        )}
        <span className="mt-0.5 block font-mono text-[10px] text-td">{option.key}</span>
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          name={`amount_${option.id}`}
          defaultValue={option.amount}
          min={0}
          className={num}
          aria-label={`${option.label} summa`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          name={`monthly_${option.id}`}
          defaultValue={option.monthly}
          min={0}
          className={num}
          aria-label={`${option.label} oylik`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          name={`externalMin_${option.id}`}
          defaultValue={option.externalMin}
          min={0}
          className={num}
          aria-label={`${option.label} tashqi min`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          name={`externalMax_${option.id}`}
          defaultValue={option.externalMax}
          min={0}
          className={num}
          aria-label={`${option.label} tashqi max`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          name={`weeks_${option.id}`}
          defaultValue={option.weeks}
          min={0}
          max={52}
          className={num}
          aria-label={`${option.label} hafta`}
        />
      </td>
      <td className="py-2 text-center">
        <input
          type="checkbox"
          name={`active_${option.id}`}
          defaultChecked={option.active}
          className="size-4 accent-[var(--color-crimson)]"
          aria-label={`${option.label} faol`}
        />
      </td>
    </tr>
  );
}

