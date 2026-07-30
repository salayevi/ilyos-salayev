import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/site/reveal";
import { getServices } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Xizmatlar",
  description: "Diagnostika, qurilish va hamrohlik — natijasi oldindan kelishiladigan uch shakl.",
};

const PROCESS = [
  { title: "Suhbat", body: "30 daqiqa. Muammoni tinglayman, taklif bermayman." },
  { title: "Taklif", body: "Aniq natija, muddat va narx — bitta sahifada." },
  { title: "Ish", body: "Haftalik demo, ochiq repozitoriy, qora quti yo'q." },
  { title: "Topshirish", body: "Hujjat, test va bir oylik qo'llab-quvvatlash." },
];

export default function ServicesPage() {
  const services = getServices({ onlyPublished: true });

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-9 md:px-10 md:pt-28 lg:px-20">
        <p className="label text-[10px] md:text-xs">Xizmatlar</p>
        <h1 className="mt-3.5 font-display text-[48px] leading-[1.02] tracking-[-0.03em] text-balance md:mt-6 md:text-8xl">
          Qanday ishlaymiz
        </h1>
        <p className="mt-4 max-w-[560px] text-base text-ts md:mt-5 md:text-lg">
          Uch xil hamkorlik shakli. Har birida natija oldindan kelishiladi.
        </p>

        <div className="mt-8 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-6">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <article
                className={`flex h-full flex-col rounded-[16px] border bg-s1 p-6 md:p-8 ${
                  s.highlighted ? "border-gold" : "border-line"
                }`}
              >
                {s.highlighted && (
                  <p className="label mb-3 text-[10px] text-gold">Ko&apos;p tanlanadi</p>
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-2xl font-medium">{s.title}</h2>
                  <span className="shrink-0 font-mono text-xs text-tt">{s.duration}</span>
                </div>
                <p className="mt-3 text-[15px] leading-[1.7] text-ts">{s.description}</p>

                {s.features.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {s.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-sm text-ts">
                        <span aria-hidden className="text-gold">
                          &mdash;
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-6">
                  {s.priceNote && <p className="label mb-3 text-[10px]">{s.priceNote}</p>}
                  <Link
                    href="/contact"
                    className={`flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      s.highlighted
                        ? "bg-gold text-void hover:bg-gold-300"
                        : "border border-line-2 hover:border-line-3 hover:bg-s2"
                    }`}
                  >
                    So&apos;rov yuborish
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-14 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <h2 className="label text-[10px] md:text-xs">Jarayon</h2>
        </Reveal>
        <ol className="mt-5 md:mt-7">
          {PROCESS.map((p, i) => (
            <li key={p.title} className="flex gap-4 border-b border-line py-4 md:gap-6 md:py-6">
              <span className="pt-1 font-mono text-xs text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[17px] font-medium md:text-xl">{p.title}</h3>
                <p className="mt-1 text-sm text-tt md:text-base">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
