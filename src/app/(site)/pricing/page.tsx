import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/site/reveal";
import { formatMoney } from "@/lib/format";
import { getCatalog } from "@/lib/queries";
import { abs, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Xizmatlar va narxlar",
  description:
    "Landing sahifadan to'liq tizimgacha. Har bir yo'nalishning boshlang'ich narxi ochiq, " +
    "yakuniy narx esa kalkulyator orqali loyihangizga qarab hisoblanadi.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Xizmatlar va narxlar — Ilyos Salayev",
    description: "Boshlang'ich narxlar ochiq. Yakuniy narxni kalkulyator hisoblaydi.",
    url: abs("/pricing"),
  },
};

const FAQ = [
  {
    q: "Nega yakuniy narx darhol ko'rsatilmaydi?",
    a: "Chunki u yo'q. Bir xil «sayt» so'zi ortida bir haftalik ish ham, uch oylik tizim ham turishi mumkin. Kalkulyator sizdan hajm, dizayn va funksiyalarni so'raydi va shundan keyin raqam beradi — har bir qismi ochiq ko'rsatilgan holda.",
  },
  {
    q: "Ko'rsatilgan narx o'zgaradimi?",
    a: "Kalkulyator bergan raqam taxminiy. Suhbatdan keyin bitta sahifalik taklif beraman va undagi narx qat'iy — ish davomida o'zgarmaydi. Agar siz hajmni o'zgartirsangiz, farqi alohida kelishiladi.",
  },
  {
    q: "Oylik to'lov majburiymi?",
    a: "Yo'q. Parvarishsiz ham topshiraman — kod va kirish ma'lumotlari sizniki bo'ladi. Lekin hosting, yangilanishlar va xatolarni kimdir kuzatishi kerak; buni o'zingiz qilsangiz ham bo'ladi.",
  },
  {
    q: "Tashqi xizmatlar to'lovi nima?",
    a: "Hosting, domen, SMS, AI API — bularni men emas, ularning egalari oladi va siz to'g'ridan-to'g'ri to'laysiz. Kalkulyator ularni alohida ko'rsatadi, chunki ularni ishlab chiqish narxiga qo'shib yuborish rost bo'lmaydi.",
  },
];

export default async function PricingPage() {
  const catalog = await getCatalog({ onlyPublished: true });
  const projects = catalog.filter((s) => s.kind === "project");
  const fixed = catalog.filter((s) => s.kind !== "project");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Bosh sahifa", path: "/" },
              { name: "Xizmatlar va narxlar", path: "/pricing" },
            ]),
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ),
        }}
      />

      <section className="mx-auto max-w-[1440px] px-5 pt-9 md:px-10 md:pt-28 lg:px-20">
        <p className="label text-[10px] md:text-xs">Xizmatlar va narxlar</p>
        <h1 className="mt-3.5 font-display text-[48px] leading-[1.02] tracking-[-0.03em] text-balance md:mt-6 md:text-8xl">
          Nima qurmoqchisiz?
        </h1>
        <p className="mt-4 max-w-[620px] text-base text-ts md:mt-5 md:text-lg">
          Har bir yo&apos;nalishning boshlang&apos;ich narxi ochiq. Yakuniy raqam loyihaning
          hajmiga, dizayniga va funksiyalariga bog&apos;liq — uni kalkulyator hisoblaydi va
          nimadan tashkil topganini qatorma-qator ko&apos;rsatadi.
        </p>
      </section>

      {projects.length === 0 ? (
        <section className="mx-auto max-w-[1440px] px-5 pt-10 md:px-10 lg:px-20">
          <p className="text-ts">Katalog hozircha bo&apos;sh.</p>
        </section>
      ) : (
        <section className="mx-auto max-w-[1440px] px-5 pt-10 md:px-10 md:pt-16 lg:px-20">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {projects.map((service, i) => (
              <Reveal key={service.id} delay={i * 60}>
                <Link
                  href={`/pricing/${service.slug}`}
                  className="group flex h-full flex-col rounded-[16px] border border-line bg-s1 p-6 transition-colors hover:border-line-3 md:p-7"
                >
                  <h2 className="text-xl font-medium md:text-2xl">{service.name}</h2>
                  <p className="mt-2.5 text-[15px] leading-[1.65] text-ts">{service.summary}</p>

                  <div className="mt-5 border-t border-line pt-4">
                    <p className="font-display text-[30px] leading-none text-accent-text">
                      {formatMoney(service.basePrice, service.currency)}
                      <span className="ml-2 align-middle font-sans text-xs text-tt">
                        dan boshlab
                      </span>
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] text-tt">
                      {service.weeksMin}–{service.weeksMax} hafta
                    </p>
                  </div>

                  {service.includes.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-1.5">
                      {service.includes.slice(0, 4).map((item) => (
                        <li key={item} className="flex gap-2.5 text-[13.5px] text-ts">
                          <span aria-hidden className="text-tm">
                            &mdash;
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  <span className="mt-auto flex items-center gap-2 pt-6 text-[14px] text-accent-text">
                    Narxni hisoblash
                    <span
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {fixed.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-30 lg:px-20">
          <Reveal>
            <div className="border-b border-line pb-5">
              <h2 className="label text-[10px] md:text-xs">01 / Belgilangan narxli</h2>
            </div>
          </Reveal>
          <p className="mt-5 max-w-[620px] text-[15px] text-ts md:text-base">
            Bularning hajmi oldindan ma&apos;lum, shuning uchun kalkulyator kerak emas — narxi
            shu.
          </p>
          <div className="mt-6 grid gap-5 md:mt-9 md:grid-cols-2 md:gap-6">
            {fixed.map((service, i) => (
              <Reveal key={service.id} delay={i * 60}>
                <article className="flex h-full flex-col rounded-[16px] border border-line bg-s1 p-6 md:p-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-xl font-medium md:text-2xl">{service.name}</h3>
                    <p className="shrink-0 font-display text-[28px] leading-none text-accent-text">
                      {formatMoney(service.basePrice, service.currency)}
                      {service.kind === "retainer" && (
                        <span className="ml-1 align-middle font-sans text-xs text-tt">/oy</span>
                      )}
                    </p>
                  </div>
                  <p className="mt-3 text-[15px] leading-[1.7] text-ts">{service.description}</p>
                  {service.includes.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-1.5">
                      {service.includes.map((item) => (
                        <li key={item} className="flex gap-2.5 text-[13.5px] text-ts">
                          <span aria-hidden className="text-accent-text">
                            &mdash;
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-6">
                    <Link
                      href={`/contact?xizmat=${service.slug}`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-line-2 text-sm font-medium transition-colors hover:border-line-3 hover:bg-s2"
                    >
                      So&apos;rov yuborish
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <h2 className="label text-[10px] md:text-xs">02 / Ko&apos;p so&apos;raladi</h2>
        </Reveal>
        <dl className="mt-6 max-w-[760px] md:mt-9">
          {FAQ.map((f) => (
            <Reveal key={f.q}>
              <div className="border-b border-line py-5 md:py-7">
                <dt className="text-lg font-medium md:text-xl">{f.q}</dt>
                <dd className="mt-2.5 text-[15px] leading-[1.72] text-ts md:text-base">{f.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      <div aria-hidden className="accent-rule mt-16 md:mt-30" />
      <section className="relative overflow-hidden px-5 py-16 text-center md:px-10 md:py-32">
        <div
          aria-hidden
          className="pool"
          style={{ width: 900, height: 520, left: "50%", top: 0, transform: "translateX(-50%)" }}
        />
        <div className="relative">
          <p className="label text-[10px] md:text-xs">Keyingi qadam</p>
          <p className="mt-6 font-display text-[40px] leading-none tracking-[-0.03em] text-balance md:mt-7 md:text-7xl">
            Qaysi biri sizniki?
          </p>
          <p className="mt-4 text-base text-ts md:mt-5 md:text-lg">
            Bilmasangiz ham zarari yo&apos;q — loyihani aytasiz, men aytaman.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-accent px-7 text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover md:mt-10 md:w-auto"
          >
            Suhbatni boshlash
          </Link>
        </div>
      </section>
    </>
  );
}
