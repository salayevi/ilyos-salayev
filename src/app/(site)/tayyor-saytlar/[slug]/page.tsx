import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowserFrame, hostOf } from "@/components/site/media-frame";
import { OrderForm } from "@/components/site/order-form";
import { Reveal } from "@/components/site/reveal";
import { PRODUCT_STATUS_LABELS, formatMoney } from "@/lib/format";
import { getProductBySlug, getProducts } from "@/lib/queries";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Topilmadi" };
  return { title: product.title, description: product.summary };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.published) notFound();

  const price = formatMoney(product.price, product.currency);
  const sold = product.status === "sold";
  const others = (await getProducts({ onlyPublished: true }))
    .filter((p) => p.id !== product.id && p.status !== "sold")
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-[1440px] px-5 pt-8 pb-4 md:px-10 md:pt-20 lg:px-20">
      <Link href="/tayyor-saytlar" className="label text-[10px] hover:text-tp md:text-xs">
        &larr; Tayyor saytlar
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-6 md:mt-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-line-2 px-2 py-0.5 font-mono text-[10px] text-tt">
              {product.category}
            </span>
            <span
              className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                sold ? "border-line-2 bg-s3 text-tt" : "border-ok/40 bg-ok-bg text-ok"
              }`}
            >
              {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[42px] leading-[1.02] tracking-[-0.03em] text-balance md:text-7xl">
            {product.title}
          </h1>
          <p className="mt-3.5 max-w-[640px] text-base text-ts md:mt-5 md:text-lg">
            {product.summary}
          </p>
        </div>

        <div className="shrink-0">
          {price ? (
            <p className="font-display text-[44px] leading-none text-accent-text md:text-6xl">{price}</p>
          ) : (
            <p className="text-lg text-ts">Narx kelishiladi</p>
          )}
          {product.priceNote && <p className="mt-2 text-sm text-tt">{product.priceNote}</p>}
        </div>
      </header>

      <div className="mt-8 md:mt-12">
        <BrowserFrame
          src={product.previewImage || undefined}
          url={product.demoUrl}
          alt={`${product.title} sayti ekrani`}
          priority
          sizes="(max-width: 1440px) 100vw, 1440px"
        />
        {product.demoUrl && (
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={product.demoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-11 items-center rounded-lg border border-line-2 px-5 text-sm font-medium transition-colors hover:border-line-3 hover:bg-s2"
            >
              Jonli demoni ochish &rarr;
            </a>
            <span className="inline-flex h-11 items-center font-mono text-xs text-tt">
              {hostOf(product.demoUrl)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-12 grid gap-10 md:mt-20 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div className="min-w-0">
          {product.description && (
            <Reveal>
              <section>
                <h2 className="label text-[10px] md:text-xs">Tavsif</h2>
                {product.description.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="mt-3 text-base leading-[1.75] text-ts md:mt-5 md:text-[19px] md:leading-[1.8]"
                  >
                    {para}
                  </p>
                ))}
              </section>
            </Reveal>
          )}

          {product.includes.length > 0 && (
            <Reveal>
              <section className="mt-10 md:mt-16">
                <h2 className="label text-[10px] md:text-xs">Nima kiradi</h2>
                <ul className="mt-4 grid gap-2.5 md:mt-6 md:grid-cols-2">
                  {product.includes.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[15px] text-ts md:text-base">
                      <span aria-hidden className="text-accent-text">
                        &mdash;
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {product.stack.length > 0 && (
            <Reveal>
              <section className="mt-10 md:mt-16">
                <h2 className="label text-[10px] md:text-xs">Texnologiya</h2>
                <ul className="mt-3.5 flex flex-wrap gap-2.5 md:mt-5">
                  {product.stack.map((t) => (
                    <li key={t} className="bg-s3 px-2.5 py-1.5 font-mono text-[11px] text-ts md:text-xs">
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}
        </div>

        {/* The buy panel follows the reader down a long description rather than
            making them scroll back up to act on it. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {sold ? (
            <div className="rounded-[16px] border border-line bg-s1 p-6 text-center md:p-8">
              <p className="text-xl font-medium">Bu sayt sotilgan</p>
              <p className="mt-2.5 text-[15px] leading-[1.7] text-ts">
                Shunga o&apos;xshashini qurib berishim mumkin — yozing, kelishamiz.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-tp transition-colors hover:bg-accent-hover"
              >
                Bog&apos;lanish
              </Link>
            </div>
          ) : (
            <OrderForm
              kind="product"
              itemId={product.id}
              itemTitle={product.title}
              priceLine={price ?? product.priceNote ?? null}
              submitLabel="Sotib olish so'rovi"
            />
          )}
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-16 border-t border-line pt-10 md:mt-28 md:pt-14">
          <h2 className="label text-[10px] md:text-xs">Boshqa tayyor saytlar</h2>
          <ul className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3">
            {others.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/tayyor-saytlar/${p.slug}`}
                  className="flex h-full flex-col justify-between gap-4 rounded-[12px] border border-line bg-s1 p-5 transition-colors hover:border-line-accent"
                >
                  <span className="text-[17px] font-medium">{p.title}</span>
                  <span className="font-mono text-sm text-accent-text">
                    {formatMoney(p.price, p.currency) ?? "Kelishiladi"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
