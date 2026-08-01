import type { Metadata } from "next";
import Link from "next/link";

import { getPosts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Jurnal",
  description: "Muhandislik yozuvlari — ovoz, xotira, arxitektura.",
};

export default async function JournalPage() {
  const posts = await getPosts({ onlyPublished: true });

  return (
    <section className="mx-auto max-w-[900px] px-5 pt-9 md:px-10 md:pt-28">
      <p className="label text-[10px] md:text-xs">Yozuvlar</p>
      <h1 className="mt-3.5 font-display text-[52px] leading-none tracking-[-0.03em] md:mt-6 md:text-8xl">
        Jurnal
      </h1>

      {posts.length === 0 ? (
        <p className="mt-10 text-ts">Hozircha yozuv yo&apos;q.</p>
      ) : (
        <ul className="mt-8 md:mt-14">
          {posts.map((p) => (
            <li key={p.id} className="border-b border-line">
              <Link href={`/journal/${p.slug}`} className="group block py-6 md:py-8">
                <h2 className="text-xl leading-[1.3] font-medium transition-colors group-hover:text-gold md:text-[28px]">
                  {p.title}
                </h2>
                {p.excerpt && <p className="mt-2.5 text-[15px] text-ts md:text-base">{p.excerpt}</p>}
                <p className="mt-3 flex gap-3 text-[13px] text-tt">
                  {p.topic && <span>{p.topic}</span>}
                  <span aria-hidden>·</span>
                  <span>{p.readMinutes} daq</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
