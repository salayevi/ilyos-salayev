import Image from "next/image";
import Link from "next/link";

import { PRODUCT_STATUS_LABELS, formatMoney } from "@/lib/format";
import { getProducts } from "@/lib/queries";

const STATUS_STYLES: Record<string, string> = {
  available: "bg-ok-bg text-ok",
  reserved: "bg-warn-bg text-warn",
  sold: "bg-s3 text-tt",
};

export default async function AdminStore() {
  const products = await getProducts();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Tayyor saytlar</h1>
          <p className="mt-2 text-sm text-tt">
            Sotuvga qo&apos;yilgan saytlar. Saytda «Tayyor saytlar» sahifasida ko&apos;rinadi.
          </p>
        </div>
        <Link
          href="/admin/store/new"
          className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-tp transition-colors hover:bg-accent-hover"
        >
          Yangi e&apos;lon
        </Link>
      </header>

      {products.length === 0 ? (
        <p className="mt-10 text-sm text-tt">
          Hozircha sotuvda sayt yo&apos;q. Tayyor loyihani qo&apos;shib, narx qo&apos;ying.
        </p>
      ) : (
        <ul className="mt-6 md:mt-8">
          {products.map((p) => (
            <li key={p.id} className="border-b border-line">
              <Link
                href={`/admin/store/${p.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 transition-colors hover:bg-s1"
              >
                <div className="relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded border border-line bg-base md:w-28">
                  {p.previewImage ? (
                    <Image
                      src={p.previewImage}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-td">
                      —
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {p.title}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        STATUS_STYLES[p.status] ?? STATUS_STYLES.available
                      }`}
                    >
                      {PRODUCT_STATUS_LABELS[p.status] ?? p.status}
                    </span>
                    {!p.published && (
                      <span className="rounded bg-s3 px-1.5 py-0.5 text-[10px] text-tt">
                        yashirin
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-tt">{p.summary}</p>
                </div>

                <p className="font-mono text-sm text-accent-text">
                  {formatMoney(p.price, p.currency) ?? "kelishiladi"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
