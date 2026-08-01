import Link from "next/link";
import { notFound } from "next/navigation";

import { PostForm } from "@/components/admin/post-form";
import { getPostById } from "@/lib/queries";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/journal" className="label text-[10px] hover:text-tp">
          &larr; Jurnal
        </Link>
        <Link
          href={`/journal/${post.slug}`}
          target="_blank"
          className="text-[13px] text-gold hover:text-gold-300"
        >
          Saytda ko&apos;rish &rarr;
        </Link>
      </div>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">{post.title}</h1>
      <div className="mt-8">
        <PostForm post={post} />
      </div>
    </>
  );
}
