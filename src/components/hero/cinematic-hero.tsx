"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { heroManifest } from "@/lib/hero-manifest";
import { FrameSequence, pickTier } from "./frame-sequence";
import { SceneAudio } from "./scene-audio";

/** Scroll distance given to the sequence. Long enough that a frame lasts ~3vh. */
const SCRUB_VH = 420;
/** Playhead easing per frame — low enough to feel weighted, high enough to track. */
const EASE = 0.11;

type Props = {
  eyebrow: string;
  line1: string;
  line2: string;
  accent: string;
};

export function CinematicHero({ eyebrow, line1, line2, accent }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<SceneAudio | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  // ── the scrub engine ────────────────────────────────────────────────────
  useEffect(() => {
    if (reduced) return;

    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const { tier } = pickTier(heroManifest);
    const seq = new FrameSequence(heroManifest, tier, {
      onProgress: (n) => setLoaded(n),
      onCoarseReady: () => setReady(true),
    });
    seq.start();

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // clientWidth can read 0 before the sticky container has been laid out
      // (and during some mobile orientation changes). Falling back to the
      // viewport keeps the backing store valid instead of collapsing to 0x0,
      // which would make every later drawImage throw.
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (w <= 0 || h <= 0) return;
      if (w === width && h === height) return;

      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawn = -1; // force a repaint at the new size
    };

    /** Returns false when no frame was available, so the caller can retry. */
    const draw = (frame: number) => {
      const img = seq.frameFor(frame);
      if (!img) return false;

      // cover-fit: fill the viewport, crop the overflow, never letterbox
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      return true;
    };

    let playhead = 0;
    let target = 0;
    let lastDrawn = -1;
    let lastProgress = 0;
    let velocity = 0;
    let raf = 0;

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;

      // Velocity feeds the wind layer; smoothed so a trackpad flick does not spike it.
      const delta = Math.abs(p - lastProgress);
      velocity += (Math.min(1, delta * 26) - velocity) * 0.16;
      lastProgress = p;

      target = p * (seq.total - 1);
      playhead += (target - playhead) * EASE;
      // Snap once we are within a hair, so a held position lands on an exact frame.
      if (Math.abs(target - playhead) < 0.01) playhead = target;

      const frame = Math.round(playhead);
      if (frame !== lastDrawn) {
        // Only commit lastDrawn on a real paint. Early ticks run before any
        // frame has decoded; recording them would leave the canvas black
        // forever, because the playhead has not moved since.
        if (draw(frame)) lastDrawn = frame;
        seq.setPlayhead(frame);
      }

      audioRef.current?.update(p, velocity);

      // Overlays are written straight to the DOM. Calling setState here would
      // re-render the whole hero sixty times a second and eat the frame budget
      // the sequence needs.
      if (titleRef.current) {
        titleRef.current.style.opacity = String(Math.max(0, 1 - p / 0.22));
      }
      if (cueRef.current) {
        cueRef.current.style.opacity = String(Math.max(0, 1 - p / 0.08));
      }
      if (barRef.current) barRef.current.style.width = `${p * 100}%`;
      if (readoutRef.current) {
        readoutRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    // Catches the case where the container gains its real size after mount.
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      seq.destroy();
    };
  }, [reduced]);

  // ── audio lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  const toggleSound = async () => {
    if (!audioRef.current) audioRef.current = new SceneAudio();
    if (soundOn) {
      await audioRef.current.stop();
      setSoundOn(false);
    } else {
      await audioRef.current.start();
      setSoundOn(true);
    }
  };

  const pct = Math.round((loaded / heroManifest.total) * 100);

  if (reduced) {
    return (
      <section className="relative h-[100svh] overflow-hidden bg-void">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${heroManifest.tiers.hd.dir}/0001.${heroManifest.ext}`}
          alt="Ilyos Salayev"
          className="absolute inset-0 size-full object-cover"
        />
        <HeroTitle eyebrow={eyebrow} line1={line1} line2={line2} accent={accent} />
      </section>
    );
  }

  return (
    <section ref={sectionRef} style={{ height: `${SCRUB_VH}vh` }} className="relative bg-void">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />

        {/* Grades the daylight footage into the site's palette at the edges. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 40%, transparent 40%, rgb(5 6 7 / 0.55) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
          style={{ background: "linear-gradient(180deg, transparent, var(--color-void))" }}
        />

        <HeroTitle ref={titleRef} eyebrow={eyebrow} line1={line1} line2={line2} accent={accent} />

        {/* loading veil */}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-void">
            <div className="w-48 text-center">
              <div className="h-px w-full bg-line-2">
                <div
                  className="h-px bg-gold transition-[width] duration-300"
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>
              <p className="label mt-4 text-[10px]">Sahna yuklanmoqda</p>
            </div>
          </div>
        )}

        {/* scroll cue */}
        <div
          ref={cueRef}
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2"
          style={{ opacity: 0 }}
        >
          <span className="label text-[10px]">Vaqtni siz boshqarasiz</span>
          <span aria-hidden className="h-10 w-px overflow-hidden bg-line-2">
            <span className="block h-3 w-px animate-[cue_2.2s_ease-in-out_infinite] bg-gold" />
          </span>
        </div>

        {/* timeline + sound, bottom right */}
        <div className="absolute right-4 bottom-6 flex items-center gap-3 md:right-8">
          <span ref={readoutRef} className="label hidden text-[10px] tabular-nums sm:inline">
            000
          </span>
          <span aria-hidden className="hidden h-px w-24 bg-line-2 sm:block">
            <span ref={barRef} className="block h-px bg-gold" style={{ width: "0%" }} />
          </span>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="inline-flex h-9 items-center rounded-full border border-line-2 bg-[rgb(5_6_7/0.5)] px-3.5 text-[11px] tracking-[0.08em] text-ts uppercase backdrop-blur transition-colors hover:border-gold hover:text-tp"
          >
            {soundOn ? "Ovoz yoniq" : "Ovoz"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cue {
          0% { transform: translateY(-12px); opacity: 0 }
          40% { opacity: 1 }
          100% { transform: translateY(40px); opacity: 0 }
        }
      `}</style>
    </section>
  );
}

const HeroTitle = forwardRef<HTMLDivElement, Props>(function HeroTitle(
  { eyebrow, line1, line2, accent },
  ref,
) {
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 flex items-end px-5 pb-24 md:items-center md:px-10 md:pb-0 lg:px-20"
    >
      <div className="max-w-[min(90vw,720px)]">
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
      </div>
    </div>
  );
});
