import type { Metadata } from "next";
import Link from "next/link";

import { PlanCard } from "@/components/site/plan-card";
import { PlanComparison } from "@/components/site/plan-comparison";
import { Reveal } from "@/components/site/reveal";
import { buildPlans, DEFAULT_DOG_PRICE, DEFAULT_WOLF_PRICE } from "@/lib/plans";
import { getSettings } from "@/lib/queries";
import { abs, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tariflar",
  description:
    "Dog, Wolf va Dragon — hamkorlikning uch chuqurligi. Nima kirishi, qancha vaqt olishi va " +
    "qaysi biri sizga mosligi bir sahifada.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Tariflar — Dog · Wolf · Dragon",
    description: "Hamkorlikning uch chuqurligi. Nima kiradi, qancha vaqt oladi, kimga mos.",
    url: abs("/pricing"),
  },
};

const FAQ = [
  {
    q: "Narx nega 'dan boshlab'?",
    a: "Chunki sahifalar soni, integratsiyalar va kontent hajmi har loyihada boshqacha. Ko'rsatilgan raqam — eng past chegara. Aniq narxni suhbatdan keyin bitta sahifalik taklifda beraman va u o'zgarmaydi.",
  },
  {
    q: "Dragon nega raqamsiz?",
    a: "Dragon — buyurtma tizim: baza, API, admin panel, avtomatlashtirish. Buni kartadan narxlash taxmin bo'lardi, taxminni esa keyin sizni undan qaytarishga to'g'ri keladi. Hajmni aniqlab, keyin narx aytaman.",
  },
  {
    q: "Tarifni keyin o'zgartirsa bo'ladimi?",
    a: "Ha. Ko'p loyiha Dog'dan boshlanib Wolf'ga o'sadi. To'langan summa keyingi bosqichga hisobga olinadi — qaytadan to'lash kerak emas.",
  },
  {
    q: "To'lov qanday amalga oshadi?",
    a: "Ikki qismda: boshlashda yarmi, topshirishda yarmi. Dragon uchun bosqichlarga bo'linadi. Har bir bosqich yakunida ishni ko'rasiz.",
  },
  {
    q: "Muddatga kafolat bormi?",
    a: "Ko'rsatilgan muddat — kontent va javoblar o'z vaqtida kelgan holat uchun. Kechikish sabablari har haftalik demoda ochiq aytiladi, oxirida emas.",
  },
];

export default async function PricingPage() {
  const s = await getSettings();
  // Editable from the panel; the code defaults keep the page honest when the
  // database is unreachable rather than rendering an empty price.
  const dog = Number(s.planDogPrice) || DEFAULT_DOG_PRICE;
  const wolf = Number(s.planWolfPrice) || DEFAULT_WOLF_PRICE;
  const plans = buildPlans(dog, wolf);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Bosh sahifa", path: "/" },
              { name: "Tariflar", path: "/pricing" },
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
        <p className="label text-[10px] md:text-xs">Tariflar</p>
        <h1 className="mt-3.5 font-display text-[48px] leading-[1.02] tracking-[-0.03em] text-balance md:mt-6 md:text-8xl">
          Uch chuqurlik
        </h1>
        <p className="mt-4 max-w-[600px] text-base text-ts md:mt-5 md:text-lg">
          Bular obuna emas — loyihaga qanchalik chuqur kirishimning uch darajasi. Uchalasi bir xil
          savollarga bir xil tartibda javob beradi, shuning uchun ularni yonma-yon solishtirsa
          bo&apos;ladi.
        </p>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-10 md:px-10 md:pt-16 lg:px-20">
        <div className="grid items-start gap-5 md:gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.tier} delay={i * 80}>
              <PlanCard plan={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-5">
            <h2 className="label text-[10px] md:text-xs">01 / Yonma-yon</h2>
          </div>
        </Reveal>
        <Reveal>
          <PlanComparison plans={plans} />
        </Reveal>
      </section>

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
