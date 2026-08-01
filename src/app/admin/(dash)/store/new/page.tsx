import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";

// Screenshot capture polls the renderer for up to ~15s.
export const maxDuration = 60;

export default function NewProduct() {
  return (
    <>
      <Link href="/admin/store" className="label text-[10px] hover:text-tp">
        &larr; Tayyor saytlar
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">Yangi e&apos;lon</h1>
      <p className="mt-2 text-sm text-tt">
        Tayyor saytni sotuvga qo&apos;yish: demo havolasi, narx va nima kirishi.
      </p>
      <div className="mt-8">
        <ProductForm />
      </div>
    </>
  );
}
