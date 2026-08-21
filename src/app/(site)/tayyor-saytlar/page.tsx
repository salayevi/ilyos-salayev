import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { getProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Tayyor saytlar",
  description:
    "Qurib qo'yilgan, ishga tushirishga tayyor saytlar — narxi belgilangan, demosi ochiq.",
};

const STEPS = [
  { title: "Demoni ko'ring", body: "Har bir sayt jonli ishlaydi — bosib, aylanib chiqing." },
  { title: "So'rov yuboring", body: "Sotib olish tugmasi orqali. Narx sahifada turadi." },
  { title: "To'lov", body: "Payme, Click yoki bank o'tkazmasi. Shartnoma bilan." },
  { title: "Topshirish", body: "Domen, hosting va kod sizniki. Bir oy qo'llab-quvvatlash." },
];

export default async function ProductsPage() {
  const products = await getProducts({ onlyPublished: true });
  const available = products.filter((p) => p.status !== "sold");
  const sold = products.filter((p) => p.status === "sold");

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-9 md:px-10 md:pt-28 lg:px-20">
        <p className="label text-[10px] md:text-xs">Do&apos;kon</p>
        <h1 className="mt-3.5 font-display text-[48px] leading-[1.02] tracking-[-0.03em] text-balance md:mt-6 md:text-8xl">
          Tayyor saytlar
        </h1>
        <p className="mt-4 max-w-[620px] text-base text-ts md:mt-5 md:text-lg">
          Noldan buyurtma qilishga vaqtingiz yo&apos;qmi — quyidagilar allaqachon
          qurilgan. Demoni ochib ko&apos;ring, yoqsa bir necha kunda sizniki bo&apos;ladi.
        </p>

        {products.length === 0 ? (
          <div className="mt-12 rounded-[16px] border border-line bg-s1 p-10 text-center md:mt-16">
            <p className="text-xl font-medium">Hozircha sotuvda sayt yo&apos;q</p>
            <p className="mt-2.5 text-[15px] text-ts">
              Yangi tayyor loyihalar tez orada qo&apos;shiladi.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex h-11 items-center rounded-lg border border-line-2 px-5 text-sm font-medium transition-colors hover:border-line-3 hover:bg-s2"
            >
              Buyurtma bo&apos;yicha yozish
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:mt-14 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {available.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} priority={i < 3} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {sold.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pt-14 md:px-10 md:pt-24 lg:px-20">
          <h2 className="label text-[10px] md:text-xs">Sotilgan</h2>
          <div className="mt-5 grid gap-5 md:mt-8 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {sold.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1440px] px-5 pt-14 pb-4 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <h2 className="label text-[10px] md:text-xs">Qanday sotib olinadi</h2>
        </Reveal>
        <ol className="mt-5 md:mt-7">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 border-b border-line py-4 md:gap-6 md:py-6">
              <span className="pt-1 font-mono text-xs text-accent-text">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[17px] font-medium md:text-xl">{s.title}</h3>
                <p className="mt-1 text-sm text-tt md:text-base">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
