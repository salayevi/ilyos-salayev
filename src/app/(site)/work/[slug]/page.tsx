import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowserFrame, hostOf } from "@/components/site/media-frame";
import { Reveal } from "@/components/site/reveal";
import { getAdjacentProject, getProjectBySlug, getProjects } from "@/lib/queries";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Topilmadi" };
  return { title: project.title, description: project.summary };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || !project.published) notFound();

  const all = await getProjects({ onlyPublished: true });
  const index = all.findIndex((p) => p.slug === project.slug);
  const next = await getAdjacentProject(project.slug);

  const sections = [
    { key: "overview", label: "Umumiy", body: project.overview },
    { key: "problem", label: "Muammo", body: project.problem },
    { key: "research", label: "Tadqiqot", body: project.research },
    { key: "solution", label: "Yechim", body: project.solution },
    { key: "process", label: "Jarayon", body: project.process },
  ].filter((s) => s.body.trim().length > 0);

  const meta = [
    { label: "Indeks", value: `${String(index + 1).padStart(2, "0")} / ${String(all.length).padStart(2, "0")}` },
    { label: "Mijoz", value: project.client || "—" },
    { label: "Yil", value: project.year },
    { label: "Rol", value: project.role || "—" },
  ];

  return (
    <article>
      {/* meta rail — a scroll rail on mobile, a four-up grid on desktop */}
      <div className="rail overflow-x-auto border-b border-line bg-s1">
        <dl className="mx-auto flex max-w-[1440px] md:grid md:grid-cols-4">
          {meta.map((m, i) => (
            <div
              key={m.label}
              className={`shrink-0 px-5 py-4 md:px-8 md:py-6 ${i === 0 ? "lg:pl-20" : ""} ${
                i < 3 ? "border-r border-line" : ""
              }`}
            >
              <dt className="label text-[10px] md:text-[11px]">{m.label}</dt>
              <dd className="mt-1.5 text-sm whitespace-nowrap md:text-[15px]">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <header className="mx-auto max-w-[1440px] px-5 pt-8 pb-7 md:px-10 md:pt-24 md:pb-16 lg:px-20">
        <h1 className="font-display text-[44px] leading-[0.98] tracking-[-0.035em] text-balance md:text-8xl lg:text-[110px]">
          {project.title}
        </h1>
        <p className="mt-4 max-w-[720px] text-base text-ts md:mt-7 md:text-xl">{project.summary}</p>

        {(project.liveUrl || project.sourceUrl) && (
          <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center rounded-lg bg-gold px-5 text-sm font-medium text-void transition-colors hover:bg-gold-300"
              >
                Saytga o&apos;tish &rarr;
              </a>
            )}
            {project.sourceUrl && (
              <a
                href={project.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center rounded-lg border border-line-2 px-5 text-sm font-medium transition-colors hover:border-line-3 hover:bg-s2"
              >
                {project.sourceKind === "vercel" ? "Vercel" : "Repozitoriy"}
              </a>
            )}
          </div>
        )}
      </header>

      {/* The capture is the evidence the case study rests on, so it is shown at
          full width, in a window frame, before a word of the write-up. */}
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 lg:px-20">
        <BrowserFrame
          src={project.previewImage || undefined}
          url={project.liveUrl || project.sourceUrl}
          alt={`${project.title} sayti ekrani`}
          priority
          sizes="(max-width: 1440px) 100vw, 1440px"
        />
        {hostOf(project.liveUrl) && (
          <p className="mt-3 text-center text-xs text-tt">
            {hostOf(project.liveUrl)} sahifasidan olingan ekran surati
          </p>
        )}
      </div>

      <div className="mx-auto flex max-w-[1440px] gap-20 px-5 pt-12 md:px-10 md:pt-30 lg:px-20">
        {/* Sticky rail is desktop-only; on mobile the headings carry the structure. */}
        <nav aria-label="Bo'limlar" className="hidden w-50 shrink-0 lg:block">
          <ul className="sticky top-28 space-y-5 text-[15px] text-tt">
            {sections.map((s, i) => (
              <li
                key={s.key}
                className={i === 0 ? "border-l-2 border-gold pl-4 text-tp" : "pl-4.5"}
              >
                <a href={`#${s.key}`} className="hover:text-tp">
                  {s.label}
                </a>
              </li>
            ))}
            {project.metrics.length > 0 && (
              <li className="pl-4.5">
                <a href="#natija" className="hover:text-tp">
                  Natija
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 lg:max-w-[760px]">
          {sections.map((s, i) => (
            <Reveal key={s.key}>
              <section id={s.key} className={i === 0 ? "" : "mt-11 md:mt-18"}>
                <h2 className="label text-[10px] md:text-xs">{s.label}</h2>
                {s.body.split("\n\n").map((para, j) => (
                  <p
                    key={j}
                    className="mt-3 text-base leading-[1.75] text-ts md:mt-5 md:text-[19px] md:leading-[1.8]"
                  >
                    {para}
                  </p>
                ))}
              </section>
            </Reveal>
          ))}

          {project.stack.length > 0 && (
            <Reveal>
              <section className="mt-11 md:mt-18">
                <h2 className="label text-[10px] md:text-xs">Texnologiya</h2>
                <ul className="mt-3.5 flex flex-wrap gap-2.5 md:mt-5 md:gap-3">
                  {project.stack.map((t) => (
                    <li key={t} className="bg-s3 px-2.5 py-1.5 font-mono text-[11px] text-ts md:text-xs">
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {project.metrics.length > 0 && (
            <Reveal>
              <section id="natija" className="mt-11 md:mt-18">
                <h2 className="label text-[10px] md:text-xs">Natija</h2>
                <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3 md:gap-5">
                  {project.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-[12px] border border-line bg-s1 p-5 md:p-8"
                    >
                      <p className="font-display text-[40px] text-gold md:text-[52px]">{m.value}</p>
                      <p className="label mt-1.5 text-[10px] md:mt-2.5 md:text-[11px]">{m.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          {/* Two decorative gradient panels used to sit here. Beside a real
              screenshot they read as missing images, so the space now carries
              the one link a reader actually wants next. */}
          {project.liveUrl && (
            <Reveal>
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-8 flex items-center justify-between gap-4 rounded-[12px] border border-line bg-s1 p-5 transition-colors hover:border-gold/40 md:mt-14 md:p-6"
              >
                <div className="min-w-0">
                  <p className="label text-[10px]">Jonli sayt</p>
                  <p className="mt-1.5 truncate text-[17px] font-medium">
                    {hostOf(project.liveUrl)}
                  </p>
                </div>
                <span aria-hidden className="shrink-0 text-gold">
                  &rarr;
                </span>
              </a>
            </Reveal>
          )}
        </div>
      </div>

      {next && (
        <Link
          href={`/work/${next.slug}`}
          className="mt-14 block border-t border-line px-5 py-8 transition-colors hover:bg-s1 md:mt-35 md:px-10 md:py-15 lg:px-20"
        >
          <p className="label text-[10px] md:text-xs">Keyingi &rarr;</p>
          <p className="mt-2.5 text-3xl font-medium md:mt-4.5 md:text-[38px]">{next.title}</p>
        </Link>
      )}
    </article>
  );
}
