import Link from "next/link";

import { getPosts } from "@/lib/queries";

export default async function AdminJournal() {
  const posts = await getPosts();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Jurnal</h1>
        <Link
          href="/admin/journal/new"
          className="inline-flex h-11 items-center rounded-lg bg-gold px-5 text-sm font-medium text-void transition-colors hover:bg-gold-300"
        >
          Yangi yozuv
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-tt">Hozircha yozuv yo&apos;q.</p>
      ) : (
        <ul className="mt-6 md:mt-8">
          {posts.map((p) => (
            <li key={p.id} className="border-b border-line">
              <Link
                href={`/admin/journal/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 transition-colors hover:bg-s1"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {p.title}
                    {!p.published && (
                      <span className="rounded bg-s3 px-1.5 py-0.5 text-[10px] text-tt">
                        yashirin
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-tt">{p.excerpt}</p>
                </div>
                <p className="font-mono text-xs text-tt">{p.readMinutes} daq</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
