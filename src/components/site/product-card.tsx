import Link from "next/link";

import { PRODUCT_STATUS_LABELS, formatMoney } from "@/lib/format";
import type { ProductView } from "@/lib/queries";
import { MediaFrame, hostOf } from "./media-frame";

const STATUS_STYLES: Record<string, string> = {
  available: "border-ok/40 bg-ok-bg text-ok",
  reserved: "border-warn/40 bg-warn-bg text-warn",
  sold: "border-line-2 bg-s3 text-tt",
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductView;
  /** Set on the first row: one of those screenshots is the page's LCP. */
  priority?: boolean;
}) {
  const price = formatMoney(product.price, product.currency);
  const host = hostOf(product.demoUrl);
  const sold = product.status === "sold";

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[16px] border bg-s1 transition-colors ${
        sold ? "border-line opacity-70" : "border-line hover:border-gold/40"
      }`}
    >
      <Link href={`/tayyor-saytlar/${product.slug}`} className="block">
        <div className="flex h-8 items-center gap-2 border-b border-line bg-s2 px-3">
          <span aria-hidden className="flex gap-1.5">
            <i className="block size-2 rounded-full bg-line-3" />
            <i className="block size-2 rounded-full bg-line-3" />
            <i className="block size-2 rounded-full bg-line-3" />
          </span>
          {host && <span className="truncate font-mono text-[10px] text-tt">{host}</span>}
        </div>
        <MediaFrame
          src={product.previewImage || undefined}
          alt={`${product.title} sayti ekrani`}
          rounded={false}
          scrim={!product.previewImage}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-[210px] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] md:h-[250px]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-line-2 px-2 py-0.5 font-mono text-[10px] text-tt">
            {product.category}
          </span>
          <span
            className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
              STATUS_STYLES[product.status] ?? STATUS_STYLES.available
            }`}
          >
            {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
          </span>
        </div>

        <h3 className="mt-3 text-xl font-medium md:text-2xl">
          <Link href={`/tayyor-saytlar/${product.slug}`} className="hover:text-gold">
            {product.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[15px] leading-[1.65] text-ts">{product.summary}</p>

        {product.stack.length > 0 && (
          <ul className="mt-3.5 flex flex-wrap gap-2">
            {product.stack.slice(0, 4).map((t) => (
              <li
                key={t}
                className="rounded border border-line-2 px-2 py-0.5 font-mono text-[10px] text-tt"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {price ? (
              <p className="font-display text-3xl text-gold md:text-4xl">{price}</p>
            ) : (
              <p className="text-[15px] text-ts">Narx kelishiladi</p>
            )}
            {product.priceNote && <p className="mt-1 text-xs text-tt">{product.priceNote}</p>}
          </div>
          <Link
            href={`/tayyor-saytlar/${product.slug}`}
            className="inline-flex h-10 shrink-0 items-center rounded-lg border border-line-2 px-4 text-sm font-medium transition-colors hover:border-line-3 hover:bg-s2"
          >
            {sold ? "Ko'rish" : "Sotib olish"}
          </Link>
        </div>
      </div>
    </article>
  );
}
