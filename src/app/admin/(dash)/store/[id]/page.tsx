import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { getProductById } from "@/lib/queries";

// Screenshot capture polls the renderer for up to ~15s.
export const maxDuration = 60;

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/store" className="label text-[10px] hover:text-tp">
          &larr; Tayyor saytlar
        </Link>
        <Link
          href={`/tayyor-saytlar/${product.slug}`}
          target="_blank"
          className="text-[13px] text-gold hover:text-gold-300"
        >
          Saytda ko&apos;rish &rarr;
        </Link>
      </div>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">{product.title}</h1>
      <div className="mt-8">
        <ProductForm product={product} />
      </div>
    </>
  );
}
