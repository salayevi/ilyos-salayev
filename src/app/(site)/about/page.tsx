import type { Metadata } from "next";

import { Portrait } from "@/components/site/media-frame";
import { Reveal } from "@/components/site/reveal";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Men haqimda",
  description: "Ovoz, xotira va real vaqt tizimlari ustida ishlaydigan muhandis. Toshkent.",
};

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

export default function AboutPage() {
  const s = getSettings();

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-8 md:flex md:gap-20 md:px-10 md:pt-28 lg:px-20">
        {/* Cold duotone here, warm on the home hero — the shift from
            performance to person is carried by the light, not by a caption. */}
        <Portrait cold className="h-[400px] rounded-[16px] md:h-[560px] md:w-[420px] md:shrink-0" />

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
                    className={`h-0.5 w-3.5 md:w-5.5 ${i <= s.depth ? "bg-gold" : "bg-line-2"}`}
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
                className={`absolute top-1.5 -left-[27px] size-2.5 rounded-full border border-gold md:-left-[37px] md:size-2.75 ${
                  e.current ? "bg-gold" : "bg-void"
                }`}
              />
              <p className="font-mono text-xs text-gold md:text-sm">{e.year}</p>
              <p className="mt-1.5 text-lg font-medium md:mt-2 md:text-[28px]">{e.role}</p>
              <p className="mt-0.5 text-sm text-tt md:mt-1 md:text-base">{e.org}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
