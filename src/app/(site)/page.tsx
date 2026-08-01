import Link from "next/link";

import { CinematicHero } from "@/components/hero/cinematic-hero";
import { ProjectCard } from "@/components/site/project-card";
import { Reveal } from "@/components/site/reveal";
import { getFeaturedProjects, getServices, getSettings, getTestimonials } from "@/lib/queries";

const STATS = [
  { value: "12+", label: "Yetkazilgan loyiha" },
  { value: "6 yil", label: "Muhandislik tajribasi" },
  { value: "143", label: "Avtotest" },
  { value: "99.9%", label: "Servis uptime" },
];

export default async function HomePage() {
  const s = await getSettings();
  const featured = await getFeaturedProjects();
  const services = await getServices({ onlyPublished: true });
  const [testimonial] = await getTestimonials();

  return (
    <>
      {/* ---------------- cinematic hero ---------------- */}
      <CinematicHero
        eyebrow={s.heroEyebrow}
        line1={s.heroLine1}
        line2={s.heroLine2}
        accent={s.heroAccent}
        subline={s.heroSubline}
        availability={s.availability}
        availabilityLabel={s.availabilityLabel}
      />

      {/* ---------------- stack rail ---------------- */}
      <div className="rail relative z-10 overflow-x-auto border-y border-line">
        <ul className="label mx-auto flex max-w-[1440px] items-center gap-10 px-5 py-8 text-[13px] whitespace-nowrap md:gap-16 md:px-10 lg:px-20">
          {["Python", "Rust", "C++", "Next.js", "PostgreSQL", "Whisper", "Silero", "Tauri"].map(
            (t) => (
              <li key={t}>{t}</li>
            ),
          )}
        </ul>
      </div>

      {/* ---------------- selected work ---------------- */}
      <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-5">
            <h2 className="label text-[10px] md:text-xs">01 / Tanlangan ishlar</h2>
            <Link href="/work" className="text-[13px] text-gold hover:text-gold-300 md:text-[15px]">
              Barchasini ko&apos;rish &rarr;
            </Link>
          </div>
        </Reveal>

        {featured.length > 0 ? (
          <>
            <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-2">
              {featured.slice(0, 2).map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
            {featured[2] && (
              <Reveal className="mt-6">
                <ProjectCard project={featured[2]} size="feature" />
              </Reveal>
            )}
          </>
        ) : (
          <p className="mt-10 text-ts">Hozircha tanlangan loyiha yo&apos;q.</p>
        )}
      </section>

      {/* ---------------- capabilities ---------------- */}
      {services.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-35 lg:px-20">
          <Reveal>
            <h2 className="label text-[10px] md:text-xs">02 / Imkoniyatlar</h2>
          </Reveal>
          <div className="mt-5 grid gap-4 md:mt-9 md:grid-cols-3 md:gap-6">
            {services.map((c, i) => (
              <Reveal key={c.id} delay={i * 80}>
                <article className="h-full rounded-[16px] border border-line bg-s1 p-6 md:p-10">
                  <p className="font-mono text-xs text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3.5 text-xl font-medium md:mt-5 md:text-2xl">{c.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-[1.72] text-ts md:mt-3.5 md:text-base">
                    {c.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- numbers ---------------- */}
      <section className="mt-16 grid grid-cols-2 border-y border-line md:mt-35 md:grid-cols-4">
        {STATS.map((n, i) => (
          <div
            key={n.label}
            className={`px-5 py-7 md:px-10 md:py-14 ${i < 3 ? "md:border-r md:border-line" : ""} ${
              i % 2 === 0 ? "border-r border-line md:border-r" : ""
            } ${i < 2 ? "border-b border-line md:border-b-0" : ""}`}
          >
            <p className="font-display text-[40px] text-gold md:text-6xl">{n.value}</p>
            <p className="label mt-1.5 text-[10px] md:mt-2.5 md:text-xs">{n.label}</p>
          </div>
        ))}
      </section>

      {/* ---------------- testimonial ---------------- */}
      {testimonial && (
        <Reveal>
          <figure className="mx-auto max-w-[900px] px-6 py-14 text-center md:py-32">
            <blockquote className="font-display text-[26px] leading-[1.38] italic text-balance md:text-[44px] md:leading-[1.4]">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="label mt-5 text-[10px] md:mt-8 md:text-xs">
              {testimonial.author}
              {testimonial.roleLine ? ` · ${testimonial.roleLine}` : ""}
            </figcaption>
          </figure>
        </Reveal>
      )}

      {/* ---------------- contact ---------------- */}
      <div aria-hidden className="gold-rule" />
      <section className="relative overflow-hidden px-5 py-16 text-center md:px-10 md:py-37">
        <div
          aria-hidden
          className="pool"
          style={{ width: 900, height: 520, left: "50%", top: 0, transform: "translateX(-50%)" }}
        />
        <div className="relative">
          <p className="label text-[10px] md:text-xs">03 / Bog&apos;lanish</p>
          <p className="mt-6 font-display text-[44px] leading-none tracking-[-0.03em] text-balance md:mt-7 md:text-8xl">
            Loyihangiz bormi?
          </p>
          <p className="mt-4 text-base text-ts md:mt-5 md:text-lg">
            Bir ish kuni ichida javob beraman.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 md:mt-11 md:flex-row md:gap-4">
            <Link
              href="/contact"
              className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-gold px-7 text-[15px] font-medium text-void transition-colors hover:bg-gold-300 md:w-auto"
            >
              Suhbatni boshlash
            </Link>
            <a
              href={`mailto:${s.email}`}
              className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-lg border border-line-2 px-7 text-[15px] font-medium transition-colors hover:border-line-3 hover:bg-s2 md:w-auto"
            >
              {s.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
