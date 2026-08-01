import Image from "next/image";
import Link from "next/link";

import { getProjects } from "@/lib/queries";

export default async function AdminProjects() {
  const projects = await getProjects();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">
            Men qilgan va qila oladiganlar
          </h1>
          <p className="mt-2 text-sm text-tt">
            Saytda «Ishlangan ishlar» sahifasida ko&apos;rinadi.
          </p>
        </div>
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
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 transition-colors hover:bg-s1"
              >
                {/* The thumbnail is how the admin sees at a glance which rows
                    are still waiting for a capture. */}
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
                    {!p.previewImage && (
                      <span className="rounded bg-warn-bg px-1.5 py-0.5 text-[10px] text-warn">
                        screenshot yo&apos;q
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
