import Link from "next/link";

import { getServices } from "@/lib/queries";

export default async function AdminServices() {
  const services = await getServices();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Xizmatlar</h1>
        <Link
          href="/admin/services/new"
          className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-tp transition-colors hover:bg-accent-hover"
        >
          Yangi xizmat
        </Link>
      </header>

      {services.length === 0 ? (
        <p className="mt-10 text-sm text-tt">Hozircha xizmat yo&apos;q.</p>
      ) : (
        <ul className="mt-6 md:mt-8">
          {services.map((s) => (
            <li key={s.id} className="border-b border-line">
              <Link
                href={`/admin/services/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 transition-colors hover:bg-s1"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {s.title}
                    {s.highlighted && (
                      <span className="rounded bg-crimson-900 px-1.5 py-0.5 text-[10px] text-crimson-100">
                        ko&apos;p tanlanadi
                      </span>
                    )}
                    {!s.published && (
                      <span className="rounded bg-s3 px-1.5 py-0.5 text-[10px] text-tt">
                        yashirin
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-tt">{s.description}</p>
                </div>
                <p className="font-mono text-xs text-tt">{s.duration}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
