import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPostBySlug } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) return { title: "Topilmadi", robots: { index: false } };
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/journal/${post.slug}`,
    type: "article",
    publishedTime: post.createdAt.toISOString(),
    modifiedTime: post.updatedAt.toISOString(),
  });
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  return (
    <article className="mx-auto max-w-[720px] px-5 pt-9 md:px-10 md:pt-28">
      <Link href="/journal" className="label text-[10px] hover:text-tp md:text-xs">
        &larr; Jurnal
      </Link>

      <h1 className="mt-5 font-display text-[36px] leading-[1.08] tracking-[-0.03em] text-balance md:mt-7 md:text-[56px]">
        {post.title}
      </h1>

      <p className="mt-4 flex gap-3 text-[13px] text-tt md:mt-5">
        {post.topic && <span>{post.topic}</span>}
        <span aria-hidden>·</span>
        <span>{post.readMinutes} daqiqalik o&apos;qish</span>
      </p>

      <div aria-hidden className="accent-rule mt-7 md:mt-9" />

      <div className="mt-7 md:mt-9">
        {post.body.split("\n\n").map((para, i) => (
          <p key={i} className="mt-5 text-base leading-[1.8] text-ts md:text-lg">
            {para}
          </p>
        ))}
      </div>
    </article>
  );
}
