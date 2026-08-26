import type { Metadata } from "next";

import { Photo } from "@/components/site/photo";
import { Reveal } from "@/components/site/reveal";
import { getSettings } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Men haqimda",
  description: "Ovoz, xotira va real vaqt tizimlari ustida ishlaydigan muhandis. Toshkent.",
  path: "/about",
});

const SKILLS = [
  { area: "Ovoz va audio", tools: "Silero · Whisper · WebRTC AEC", years: "6 yil", depth: 5 },
  { area: "Backend", tools: "Python · Go · PostgreSQL", years: "6 yil", depth: 5 },
  { area: "Mahalliy kod", tools: "Rust · C++", years: "3 yil", depth: 4 },
  { area: "Frontend", tools: "Next.js · React · TypeScript", years: "4 yil", depth: 4 },
  { area: "Infratuzilma", tools: "Docker · CI · Nginx", years: "5 yil", depth: 3 },
];

const TIMELINE = [
  { year: "2026", role: "Mustaqil muhandis", org: "Raqamli Suhbatdosh · Altron", current: true },
  { year: "2025", role: "Bosh muhandis", org: "ObunaZona", current: false },
  { year: "2023", role: "Backend muhandis", org: "Qadam", current: false },
  { year: "2020", role: "Dasturchi", org: "Freelance", current: false },
];

export default async function AboutPage() {
  const s = await getSettings();

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-8 md:flex md:gap-20 md:px-10 md:pt-28 lg:px-20">
        {/* Cold wash here, warm everywhere else — the shift from performance
            to person is carried by the light, not by a caption. */}
        <Photo
          src="/me/portrait.webp"
          alt="Ilyos Salayev"
          width={1400}
          height={1400}
          priority
          wash="cold"
          sizes="(max-width: 768px) 100vw, 420px"
          className="h-[400px] rounded-[16px] md:h-[560px] md:w-[420px] md:shrink-0"
        />

        <div className="pt-8 md:pt-10">
          <p className="label text-[10px] md:text-xs">Men haqimda</p>
          <h1 className="mt-4 font-display text-[34px] leading-[1.22] tracking-[-0.025em] text-balance md:mt-6 md:text-[64px] md:leading-[1.12]">
            {s.aboutTitle}
          </h1>
          {s.aboutBody.split("\n\n").map((p, i) => (
            <p
              key={i}
              className="mt-5 max-w-[600px] text-base leading-[1.75] text-ts md:mt-7 md:text-lg md:leading-[1.78]"
            >
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-14 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <h2 className="label text-[10px] md:text-xs">Ko&apos;nikmalar</h2>
        </Reveal>
        <ul className="mt-5 md:mt-7">
          {SKILLS.map((s) => (
            <li
              key={s.area}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1.5 border-b border-line py-4 md:grid-cols-[2fr_3fr_auto_auto] md:items-center md:py-5.5"
            >
              <span className="text-base font-medium md:text-[19px]">{s.area}</span>
              <span className="col-start-1 text-[13px] text-tt md:col-start-2 md:text-base md:text-ts">
                {s.tools}
              </span>
              <span
                className="col-start-2 row-start-1 flex gap-1 md:col-start-3 md:row-start-auto"
                role="img"
                aria-label={`Chuqurlik: 5 dan ${s.depth}`}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`h-0.5 w-3.5 md:w-5.5 ${i <= s.depth ? "bg-accent" : "bg-line-2"}`}
                  />
                ))}
              </span>
              <span className="col-start-2 hidden text-right font-mono text-sm text-tt md:col-start-4 md:block">
                {s.years}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-14 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <h2 className="label text-[10px] md:text-xs">Tajriba</h2>
        </Reveal>
        <ol className="mt-6 border-l border-line pl-6 md:mt-9 md:pl-8">
          {TIMELINE.map((e) => (
            <li key={e.year} className="relative pb-8 last:pb-0 md:pb-12">
              <span
                aria-hidden
                className={`absolute top-1.5 -left-[27px] size-2.5 rounded-full border border-accent md:-left-[37px] md:size-2.75 ${
                  e.current ? "bg-accent" : "bg-void"
                }`}
              />
              <p className="font-mono text-xs text-accent-text md:text-sm">{e.year}</p>
              <p className="mt-1.5 text-lg font-medium md:mt-2 md:text-[28px]">{e.role}</p>
              <p className="mt-0.5 text-sm text-tt md:mt-1 md:text-base">{e.org}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-14 md:px-10 md:pt-30 lg:px-20">
        <Reveal>
          <h2 className="label text-[10px] md:text-xs">Kadrlar</h2>
        </Reveal>

        {/* Two tall frames beside one wide one: the wide frame is the personal
            note, so it gets the room the portraits do not need. */}
        <div className="mt-5 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-5">
          <Reveal>
            <Photo
              src="/me/editorial-1.webp"
              alt="Ko'chada, tosh devor oldida"
              width={1400}
              height={1750}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="aspect-4/5 rounded-[16px]"
            />
          </Reveal>
          <Reveal delay={80}>
            <Photo
              src="/me/editorial-2.webp"
              alt="Portret, tabiiy yorug'likda"
              width={1400}
              height={2104}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="aspect-4/5 rounded-[16px]"
            />
          </Reveal>
          <Reveal delay={160}>
            <Photo
              src="/me/editorial-3.webp"
              alt="Portret, qorong'u fon"
              width={1400}
              height={2104}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="aspect-4/5 rounded-[16px]"
            />
          </Reveal>
        </div>

        <Reveal className="mt-3 md:mt-5">
          <div className="grid gap-3 md:grid-cols-5 md:gap-5">
            <Photo
              src="/me/guitar-1.webp"
              alt="Quyosh botishida gitara bilan"
              width={1400}
              height={2104}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="aspect-4/5 rounded-[16px] md:col-span-2"
            />
            <Photo
              src="/me/guitar-2.webp"
              alt="Tepalikda, shahar ustida"
              width={1400}
              height={933}
              sizes="(max-width: 768px) 100vw, 60vw"
              className="aspect-16/10 rounded-[16px] md:col-span-3"
            />
          </div>
        </Reveal>

        <p className="mt-5 max-w-[560px] text-sm leading-[1.7] text-tt md:mt-7 md:text-base">
          Ish stolidan tashqarida gitara chalaman. Ikkalasida ham bir xil narsa
          yoqadi: takrorlab mashq qilish va oxirida toza chiqadigan natija.
        </p>
      </section>
    </>
  );
}
