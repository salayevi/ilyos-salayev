import Link from "next/link";

import { getProjects } from "@/lib/queries";

export default function AdminProjects() {
  const projects = getProjects();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Loyihalar</h1>
        <Link
          href="/admin/projects/new"
          className="inline-flex h-11 items-center rounded-lg bg-gold px-5 text-sm font-medium text-void transition-colors hover:bg-gold-300"
        >
          Yangi loyiha
        </Link>
      </header>

      {projects.length === 0 ? (
        <p className="mt-10 text-sm text-tt">Hozircha loyiha yo&apos;q.</p>
      ) : (
        <ul className="mt-6 md:mt-8">
          {projects.map((p) => (
            <li key={p.id} className="border-b border-line">
              <Link
                href={`/admin/projects/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 transition-colors hover:bg-s1"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {p.title}
                    {p.featured && (
                      <span className="rounded bg-gold-900 px-1.5 py-0.5 text-[10px] text-gold-100">
                        tanlangan
                      </span>
                    )}
                    {!p.published && (
                      <span className="rounded bg-s3 px-1.5 py-0.5 text-[10px] text-tt">
                        yashirin
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-tt">{p.summary}</p>
                </div>
                <p className="font-mono text-xs text-tt">
                  {p.category} · {p.year}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
