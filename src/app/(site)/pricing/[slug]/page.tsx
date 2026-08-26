import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Calculator } from "@/components/pricing/calculator";
import { saveEstimate } from "@/lib/actions/estimate";
import { formatMoney } from "@/lib/format";
import { getCatalog, getCatalogService, getPricingConfig } from "@/lib/queries";
import { breadcrumbSchema, jsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCatalogService(slug);
  if (!service || !service.published) return { title: "Topilmadi", robots: { index: false } };

  const from = formatMoney(service.basePrice, service.currency);
  return pageMetadata({
    title: `${service.name} — narxni hisoblash`,
    description: `${service.summary} ${from ? `${from} dan boshlab.` : ""} Loyihangizni sozlang va narxni real vaqtda ko'ring.`,
    path: `/pricing/${service.slug}`,
  });
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, config, catalog] = await Promise.all([
    getCatalogService(slug),
    getPricingConfig(),
    getCatalog({ onlyPublished: true }),
  ]);

  if (!service || !service.published) notFound();
  // A fixed-price service has nothing to configure; sending someone to an empty
  // wizard would be worse than sending them back to the card that named a price.
  if (service.kind !== "project") notFound();

  const groups = config.groups.filter((g) => service.groups.includes(g.key));
  const groupKeys = new Set(groups.map((g) => g.key));
  const options = config.options.filter((o) => groupKeys.has(o.groupKey));

  const others = catalog.filter((s) => s.kind === "project" && s.slug !== service.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Bosh sahifa", path: "/" },
              { name: "Xizmatlar va narxlar", path: "/pricing" },
              { name: service.name, path: `/pricing/${service.slug}` },
            ]),
          ),
        }}
      />

      <section className="mx-auto max-w-[1440px] px-5 pt-9 md:px-10 md:pt-24 lg:px-20">
        <Link href="/pricing" className="label text-[10px] transition-colors hover:text-tp">
          &larr; Barcha xizmatlar
        </Link>
        <h1 className="mt-3.5 font-display text-[40px] leading-[1.04] tracking-[-0.03em] text-balance md:mt-5 md:text-7xl">
          {service.name}
        </h1>
        <p className="mt-4 max-w-[620px] text-base text-ts md:text-lg">{service.description}</p>
        <p className="mt-4 font-mono text-[12px] text-tt">
          {formatMoney(service.basePrice, service.currency)} dan boshlab ·{" "}
          {service.weeksMin}–{service.weeksMax} hafta
        </p>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-8 pb-16 md:px-10 md:pt-12 md:pb-24 lg:px-20">
        {groups.length === 0 ? (
          <p className="text-ts">Bu xizmat uchun konfigurator hali sozlanmagan.</p>
        ) : (
          <Calculator
            service={{
              slug: service.slug,
              name: service.name,
              basePrice: service.basePrice,
              minimumPrice: service.minimumPrice,
              currency: service.currency,
              weeksMin: service.weeksMin,
              weeksMax: service.weeksMax,
              includes: service.includes,
            }}
            groups={groups}
            options={options}
            saveAction={saveEstimate}
          />
        )}
      </section>

      {others.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10 md:pb-24 lg:px-20">
          <div className="border-t border-line pt-8">
            <p className="label text-[10px]">Boshqa yo&apos;nalishlar</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/pricing/${s.slug}`}
                    className="inline-flex h-9 items-center rounded-lg border border-line-2 px-3.5 text-[13px] text-ts transition-colors hover:border-line-3 hover:text-tp"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
