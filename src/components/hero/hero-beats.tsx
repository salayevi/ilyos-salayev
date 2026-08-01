import Link from "next/link";

import { Availability } from "@/components/site/availability";

export type BeatContent = {
  eyebrow: string;
  line1: string;
  line2: string;
  accent: string;
  subline: string;
  availability: string;
  availabilityLabel: string;
};

/**
 * Windows on the scroll timeline. Each beat fades up, holds, then clears before
 * the next arrives, so the frame is never carrying two messages at once.
 * `in`/`out` are the ramp lengths inside the window.
 */
export const BEATS = [
  { from: 0.0, to: 0.24 },
  { from: 0.26, to: 0.5 },
  { from: 0.52, to: 0.78 },
  { from: 0.8, to: 1.0 },
] as const;

const RAMP = 0.28; // fraction of a window spent fading in, and again fading out

/** 0 at the edges of the window, 1 across the middle. */
export function beatOpacity(progress: number, index: number) {
  const b = BEATS[index];
  if (!b) return 0;
  const span = b.to - b.from;
  const t = (progress - b.from) / span;
  if (t <= 0 || t >= 1) return 0;
  if (t < RAMP) return t / RAMP;
  if (t > 1 - RAMP) return (1 - t) / RAMP;
  return 1;
}

/** Beats drift upward through their window — they arrive from below, leave above. */
export function beatShift(progress: number, index: number) {
  const b = BEATS[index];
  if (!b) return 0;
  const t = Math.min(1, Math.max(0, (progress - b.from) / (b.to - b.from)));
  return (0.5 - t) * 36;
}

export function BeatOne({ eyebrow, line1, line2, accent }: BeatContent) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px w-6 bg-gold" />
        <p className="label text-[10px] md:text-xs">{eyebrow}</p>
      </div>
      <h1
        className="mt-4 font-display text-[52px] leading-[0.95] tracking-[-0.03em] text-balance text-tp md:mt-6 md:text-[92px] lg:text-[112px]"
        style={{ textShadow: "0 2px 40px rgb(5 6 7 / 0.55)" }}
      >
        {line1}
        <br />
        {line2} <span className="text-gold-300">{accent}</span>
      </h1>
    </>
  );
}

export function BeatTwo({ subline }: BeatContent) {
  return (
    <p
      className="max-w-[620px] text-lg leading-[1.7] text-tp md:text-2xl"
      style={{ textShadow: "0 2px 30px rgb(5 6 7 / 0.7)" }}
    >
      {subline}
    </p>
  );
}

export function BeatThree({ availability, availabilityLabel }: BeatContent) {
  return (
    <>
      <div className="flex flex-wrap gap-3 md:gap-4">
        <Link
          href="/work"
          className="inline-flex h-12 items-center rounded-lg bg-gold px-6 text-[15px] font-medium text-void transition-colors hover:bg-gold-300"
        >
          Ishlarni ko&apos;rish
        </Link>
        <Link
          href="/about"
          className="inline-flex h-12 items-center gap-2.5 rounded-lg border border-line-2 bg-[rgb(5_6_7/0.45)] px-5 text-[15px] font-medium backdrop-blur transition-colors hover:border-line-3 hover:bg-s2"
        >
          Men haqimda <span className="text-gold">&rarr;</span>
        </Link>
      </div>
      <Availability status={availability} label={availabilityLabel} className="mt-5" />
    </>
  );
}

export function BeatFour() {
  return (
    <p
      className="font-display text-[34px] leading-[1.15] tracking-[-0.02em] text-balance text-tp md:text-[56px]"
      style={{ textShadow: "0 2px 40px rgb(5 6 7 / 0.6)" }}
    >
      Hikoya <span className="text-gold-300">pastda</span> davom etadi.
    </p>
  );
}
