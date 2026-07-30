import Link from "next/link";

import { getMessages, getPosts, getProjects, getServices, getSettings } from "@/lib/queries";

export default function AdminHome() {
  const projects = getProjects();
  const services = getServices();
  const posts = getPosts();
  const inbox = getMessages();
  const s = getSettings();

  const stats = [
    { label: "Loyihalar", value: projects.length, sub: `${projects.filter((p) => p.published).length} nashr`, href: "/admin/projects" },
    { label: "Xizmatlar", value: services.length, sub: `${services.filter((x) => x.published).length} nashr`, href: "/admin/services" },
    { label: "Jurnal", value: posts.length, sub: `${posts.filter((p) => p.published).length} nashr`, href: "/admin/journal" },
    { label: "Xabarlar", value: inbox.length, sub: `${inbox.filter((m) => !m.read).length} o'qilmagan`, href: "/admin/messages" },
  ];

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Umumiy</h1>
        <span className="label text-[10px]">{s.availabilityLabel}</span>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-4 md:gap-4">
        {stats.map((st) => (
          <Link
            key={st.label}
            href={st.href}
            className="rounded-[12px] border border-line bg-s1 p-4 transition-colors hover:border-line-3 md:p-5"
          >
            <p className="label text-[10px]">{st.label}</p>
            <p className="mt-2 font-display text-4xl text-gold md:text-5xl">{st.value}</p>
            <p className="mt-1 text-xs text-tt">{st.sub}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8 md:mt-10">
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
          <h2 className="label text-[10px]">Oxirgi xabarlar</h2>
          <Link href="/admin/messages" className="text-[13px] text-gold hover:text-gold-300">
            Hammasi &rarr;
          </Link>
        </div>

        {inbox.length === 0 ? (
          <p className="py-8 text-sm text-tt">Hozircha xabar yo&apos;q.</p>
        ) : (
          <ul>
            {inbox.slice(0, 5).map((m) => (
              <li key={m.id} className="border-b border-line py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {m.name}
                    {!m.read && (
                      <span className="ml-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-medium text-void">
                        yangi
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-tt">
                    {new Date(m.createdAt * 1000).toLocaleDateString("uz-UZ")}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ts">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 md:mt-10">
        <h2 className="label text-[10px]">Tez amallar</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { href: "/admin/projects/new", label: "Yangi loyiha" },
            { href: "/admin/journal/new", label: "Yangi yozuv" },
            { href: "/admin/services/new", label: "Yangi xizmat" },
            { href: "/admin/settings", label: "Sozlamalar" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="inline-flex h-11 items-center rounded-lg border border-line-2 px-4 text-sm transition-colors hover:border-line-3 hover:bg-s2"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
