import type { Metadata } from "next";
import Link from "next/link";

import { StageAnchor } from "@/components/cinema/stage";
import { CinematicHero } from "@/components/hero/cinematic-hero";
import { Photo } from "@/components/site/photo";
import { ProductCard } from "@/components/site/product-card";
import { ProjectCard } from "@/components/site/project-card";
import { Reveal } from "@/components/site/reveal";
import { formatMoney } from "@/lib/format";
import {
  getCatalog,
  getFeaturedProjects,
  getPosts,
  getProducts,
  getProjects,
  getSettings,
  getTestimonials,
} from "@/lib/queries";

/**
 * The band under "about" used to carry four hand-written figures — a project
 * count, a years-of-experience claim, a test total and an uptime percentage.
 * Three of the four were unverifiable and the first went stale the moment a
 * project shipped, which is exactly the kind of number a buyer checks.
 *
 * Every figure here is now counted from the same rows the pages below render,
 * so the band cannot disagree with the site it sits in, and it grows on its
 * own as work is published. The last cell is a commitment rather than a
 * measurement, and is written as one.
 */
function stats(counts: { projects: number; products: number; services: number }) {
  return [
    { value: String(counts.projects), label: "Chop etilgan loyiha", show: counts.projects > 0 },
    { value: String(counts.products), label: "Sotuvdagi tayyor sayt", show: counts.products > 0 },
    { value: String(counts.services), label: "Xizmat yo'nalishi", show: counts.services > 0 },
    { value: "1 kun", label: "Javob muddati", show: true },
  ].filter((n) => n.show);
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    // The hero copy is editable from /admin, so the share card follows it
    // rather than drifting away from what the page actually says.
    title: `${s.heroLine1} ${s.heroLine2} ${s.heroAccent}`.trim(),
    description: s.heroSubline,
    openGraph: { title: "Ilyos Salayev", description: s.heroSubline },
  };
}

export default async function HomePage() {
  // One round trip rather than seven sequential ones. These reads do not depend
  // on each other, and awaiting them in turn made the landing page wait out the
  // sum of every query instead of the slowest one.
  const [s, flagged, allProjects, services, testimonials, allPosts, allProducts] =
    await Promise.all([
      getSettings(),
      getFeaturedProjects(),
      getProjects({ onlyPublished: true }),
      getCatalog({ onlyPublished: true }),
      getTestimonials(),
      getPosts({ onlyPublished: true }),
      getProducts({ onlyPublished: true }),
    ]);

  // Flagged work first, but a single featured item would leave a two-column
  // grid half empty — so fall back to published work until there are enough.
  const featured = flagged.length >= 2 ? flagged : allProjects.slice(0, 3);
  const [testimonial] = testimonials;
  const posts = allPosts.slice(0, 3);
  // Featured listings first; if none are flagged, still show what is for sale.
  const store = allProducts.filter((p) => p.status !== "sold");
  const forSale = (store.some((p) => p.featured) ? store.filter((p) => p.featured) : store).slice(
    0,
    3,
  );

  const counts = stats({
    projects: allProjects.length,
    // `store`, not `allProducts`: the cell is labelled "sotuvdagi" and the
    // section below renders the same filtered list. Counting sold listings
    // here would have the band claim three for sale above a grid showing two.
    products: store.length,
    services: services.length,
  });

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

      {/*
        Act III — the interior. Everything from stepping through the door to
        the last journal entry shares one slice of the score, so the music
        keeps moving through the reading without ever getting ahead of it.
      */}
      <StageAnchor name="interior" />

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
            <h2 className="label text-[10px] md:text-xs">01 / Ishlangan ishlar</h2>
            <Link href="/work" className="text-[13px] text-accent-text hover:text-crimson-100 md:text-[15px]">
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

      {/* ---------------- ready-made websites ---------------- */}
      {forSale.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-35 lg:px-20">
          <Reveal>
            <div className="flex items-baseline justify-between gap-6 border-b border-line pb-5">
              <h2 className="label text-[10px] md:text-xs">02 / Tayyor saytlar</h2>
              <Link
                href="/tayyor-saytlar"
                className="text-[13px] text-accent-text hover:text-crimson-100 md:text-[15px]"
              >
                Do&apos;konga o&apos;tish &rarr;
              </Link>
            </div>
          </Reveal>
          <p className="mt-5 max-w-[620px] text-[15px] text-ts md:text-base">
            Qurib qo&apos;yilgan saytlar — narxi belgilangan, demosi ochiq, bir necha
            kunda sizniki bo&apos;ladi.
          </p>
          <div className="mt-6 grid gap-5 md:mt-9 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {forSale.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- capabilities ----------------
          Reads the catalogue, not the retired `services` table. This band and
          /pricing now name the same work at the same starting figures, because
          they are the same rows — which is the entire point of having replaced
          two price lists with one. */}
      {services.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-35 lg:px-20">
          <Reveal>
            <div className="flex items-baseline justify-between gap-6 border-b border-line pb-5">
              <h2 className="label text-[10px] md:text-xs">03 / Imkoniyatlar</h2>
              <Link
                href="/pricing"
                className="text-[13px] text-accent-text hover:text-crimson-100 md:text-[15px]"
              >
                Narxlarni ko&apos;rish &rarr;
              </Link>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-4 md:mt-9 md:grid-cols-3 md:gap-6">
            {services.slice(0, 6).map((c, i) => (
              <Reveal key={c.id} delay={i * 80}>
                <Link
                  href={c.kind === "project" ? `/pricing/${c.slug}` : "/pricing"}
                  className="group flex h-full flex-col rounded-[16px] border border-line bg-s1 p-6 transition-colors hover:border-line-3 md:p-8"
                >
                  <p className="font-mono text-xs text-accent-text">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3.5 text-xl font-medium md:mt-5 md:text-2xl">{c.name}</h3>
                  <p className="mt-2.5 text-[15px] leading-[1.72] text-ts md:mt-3.5 md:text-base">
                    {c.summary}
                  </p>
                  <p className="mt-auto pt-5 font-mono text-[11px] text-tt">
                    {formatMoney(c.basePrice, c.currency)}
                    {c.kind === "project" ? " dan boshlab" : c.kind === "retainer" ? " / oy" : ""}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- about, in brief ---------------- */}
      <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-35 lg:px-20">
        <Reveal>
          <h2 className="label text-[10px] md:text-xs">04 / Men haqimda</h2>
        </Reveal>
        <div className="mt-5 md:mt-9 md:flex md:items-center md:gap-14">
          <Reveal className="md:w-[340px] md:shrink-0">
            <Photo
              src="/me/portrait.webp"
              alt="Ilyos Salayev"
              width={1400}
              height={1400}
              wash="cold"
              sizes="(max-width: 768px) 100vw, 340px"
              className="aspect-4/5 rounded-[16px] md:aspect-square"
            />
          </Reveal>
          <Reveal delay={80} className="mt-6 md:mt-0">
            <p className="font-display text-[28px] leading-[1.24] tracking-[-0.02em] text-balance md:text-[44px] md:leading-[1.18]">
              {s.aboutTitle}
            </p>
            <p className="mt-4 max-w-[520px] text-base leading-[1.72] text-ts md:mt-6 md:text-lg">
              {s.aboutBody.split("\n\n")[0]}
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 text-[15px] text-accent-text transition-colors hover:text-crimson-100 md:mt-8"
            >
              To&apos;liq hikoya <span aria-hidden>&rarr;</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------- numbers ----------------
          The cell count is data-dependent now, so the dividers are drawn with
          a gap-coloured grid rather than per-cell border classes keyed to
          position — one rule that holds for two cells or for four. */}
      <section className="mt-16 grid grid-cols-2 gap-px border-y border-line bg-line md:mt-35 md:grid-cols-4">
        {counts.map((n) => (
          <div key={n.label} className="bg-void px-5 py-7 md:px-10 md:py-14">
            <p className="font-display text-[40px] text-accent-text md:text-6xl">{n.value}</p>
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

      {/* ---------------- journal, in brief ---------------- */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pt-16 md:px-10 md:pt-30 lg:px-20">
          <Reveal>
            <div className="flex items-baseline justify-between gap-6 border-b border-line pb-5">
              <h2 className="label text-[10px] md:text-xs">05 / Jurnal</h2>
              <Link
                href="/journal"
                className="text-[13px] text-accent-text hover:text-crimson-100 md:text-[15px]"
              >
                Barcha yozuvlar &rarr;
              </Link>
            </div>
          </Reveal>
          <ul>
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 60}>
                <li className="border-b border-line">
                  <Link
                    href={`/journal/${post.slug}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5 transition-colors hover:bg-s1 md:py-7"
                  >
                    <span className="text-lg font-medium md:text-2xl">{post.title}</span>
                    <span className="font-mono text-xs text-tt">
                      {post.topic} · {post.readMinutes} daq
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* Act IV — the resolve. The last stretch of the score lands with it. */}
      <StageAnchor name="resolve" />

      {/* ---------------- contact ---------------- */}
      <div aria-hidden className="accent-rule" />
      <section className="relative overflow-hidden px-5 py-16 text-center md:px-10 md:py-37">
        <div
          aria-hidden
          className="pool"
          style={{ width: 900, height: 520, left: "50%", top: 0, transform: "translateX(-50%)" }}
        />
        <div className="relative">
          <p className="label text-[10px] md:text-xs">06 / Bog&apos;lanish</p>
          <p className="mt-6 font-display text-[44px] leading-none tracking-[-0.03em] text-balance md:mt-7 md:text-8xl">
            Loyihangiz bormi?
          </p>
          <p className="mt-4 text-base text-ts md:mt-5 md:text-lg">
            Bir ish kuni ichida javob beraman.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 md:mt-11 md:flex-row md:gap-4">
            <Link
              href="/contact"
              className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-accent px-7 text-[15px] font-medium text-tp transition-colors hover:bg-accent-hover md:w-auto"
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
