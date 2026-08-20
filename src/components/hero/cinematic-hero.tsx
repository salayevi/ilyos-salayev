"use client";

import { useEffect, useRef, useState } from "react";

import { useCinema, useCinemaFrame, useSegment, useStage } from "@/components/cinema/use-cinema";
import { useReducedMotion } from "@/components/cinema/use-reduced-motion";
import { clamp01, damp, easeOutCubic, lerp } from "@/lib/cinema/easing";
import { ACTS } from "@/lib/cinema/score";
import { heroManifest } from "@/lib/hero-manifest";
import { FrameSequence, pickTier } from "./frame-sequence";
import {
  BEATS,
  BeatFour,
  BeatOne,
  BeatThree,
  BeatTwo,
  beatOpacity,
  beatShift,
  type BeatContent,
} from "./hero-beats";
import { HeroScore } from "@/lib/cinema/hero-score";

/**
 * Act II — the passage.
 *
 * The hero no longer keeps a clock. It declares a window on the master
 * timeline and is told where it is; the playhead it reads is the same number
 * the soundtrack reads, which is the whole reason picture and score cannot
 * drift apart any more.
 *
 * Three deliberate details:
 *
 * - **One damped playhead for everything.** The old code eased the *frames*
 *   but drew the type, the exit fade and the readout from the un-eased value,
 *   so the picture trailed its own captions by several frames on any fast
 *   scroll. Here a single damped value drives all of them, so the scene has
 *   weight without coming apart.
 * - **The camera is in the draw, not in CSS.** Breathing, the door-entry push
 *   and pointer parallax are folded into the `drawImage` rectangle. A CSS
 *   transform on the canvas would resample an already-rasterised bitmap and
 *   soften it; adjusting the cover-fit costs nothing and stays sharp.
 * - **No geometry reads in the loop.** Scroll position arrives from the shared
 *   ticker, already measured once for the whole page.
 */

/** Scroll distance given to the sequence. Long enough that a frame lasts ~3vh. */
const SCRUB_VH = 520;
/** Seconds for the camera to close 63% of the gap to the true playhead. */
const PLAYHEAD_TAU = 0.085;
/** Where the scene starts dissolving to black so the next section can rise. */
const EXIT_FROM = 0.9;
/** How far the camera is pushed back before it crosses the threshold. */
const ENTRY_ZOOM = 1.06;
/** Pointer parallax, in pixels at the edge of the frame. */
const PARALLAX = 10;

export function CinematicHero(content: BeatContent) {
  const cinema = useCinema();
  const reduced = useReducedMotion();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const exitRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);

  const stageRef = useStage("passage");
  const sequenceRef = useRef<FrameSequence | null>(null);
  // One controller, fed the passage's own progress — the same number that
  // drives the frames, the camera and the beats. It reads nothing else.
  const [score] = useState(() => new HeroScore());

  /** Position on the passage act, 0..1. Written by the timeline, read by the loop. */
  const target = useRef(0);
  const playhead = useRef(0);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const painter = useRef<((frameTime: number, dt: number) => void) | null>(null);

  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  // ── the sequence, and the camera that looks at it ─────────────────────────
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const { tier } = pickTier(heroManifest);
    const seq = new FrameSequence(heroManifest, tier, {
      // Stepped, not per frame: this drives a loading bar, and re-rendering the
      // hero 134 times to move it a pixel is work the sequence needs.
      onProgress: (n) =>
        setLoaded((prev) => (n - prev >= 4 || n === heroManifest.total ? n : prev)),
      onCoarseReady: () => setReady(true),
    });
    seq.start();
    sequenceRef.current = seq;

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
      if (w <= 0 || h <= 0 || (w === width && h === height)) return;
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /**
     * Paints one frame of the passage.
     *
     * `zoom` and the offsets are the camera: they combine the entry push, the
     * idle breath and the pointer drift into a single cover-fit rectangle.
     */
    painter.current = (frameTime, dt) => {
      if (width === 0 || height === 0) resize();
      if (width === 0 || height === 0) return;

      const p = playhead.current;
      const index = Math.round(p * (seq.total - 1));
      const img = seq.frameFor(index);
      if (!img) return;
      seq.setPlayhead(index);

      const entry = cinema ? cinema.entry.value : 1;
      // The camera is still outside the door until `entry` completes, so it
      // starts pushed back and settles forward as the threshold is crossed.
      const push = lerp(ENTRY_ZOOM, 1, easeOutCubic(entry));

      // A slow breath, yielding to the scrub: when the visitor is driving the
      // scene the scene stops adding motion of its own.
      const stillness = 1 - clamp01(Math.abs(target.current - p) * 60);
      const breath = Math.sin(frameTime * 0.42) * 0.0045 * stillness;
      const sway = Math.sin(frameTime * 0.31) * 3.2 * stillness;

      pointer.current.x = damp(pointer.current.x, pointer.current.tx, 0.32, dt);
      pointer.current.y = damp(pointer.current.y, pointer.current.ty, 0.32, dt);

      const cover = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const scale = cover * (push + breath);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const dx = (width - w) / 2 - pointer.current.x * PARALLAX;
      const dy = (height - h) / 2 + sway - pointer.current.y * PARALLAX * 0.6;
      ctx.drawImage(img, dx, dy, w, h);
    };

    resize();
    window.addEventListener("resize", resize);
    // Catches the case where the container gains its real size after mount.
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.tx = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = (event.clientY / window.innerHeight) * 2 - 1;
    };
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      painter.current = null;
      sequenceRef.current = null;
      window.removeEventListener("resize", resize);
      if (finePointer) window.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      seq.destroy();
    };
  }, [reduced, cinema]);

  // ── the window on the master timeline ─────────────────────────────────────
  useSegment("passage", ACTS.passage.from, ACTS.passage.to, (local) => {
    target.current = local;
  });

  // ── one render pass per frame, driven by the shared loop ──────────────────
  useCinemaFrame((frame) => {
    if (reduced) return;

    /*
      The soundtrack is a function of this one value and nothing else — the same
      progress that drives the frames, the camera and the beats.

      It is handed over on the shared loop rather than from the segment's render
      callback, because that callback only fires when progress *changes*: a
      visitor who stops scrolling would never be mentioned again, and the music
      would play on for ever. `presence` closes it down over the same stretch in
      which the scene dissolves to black, so the music ends with the passage
      instead of following them into the reading below.
    */
    const local = target.current;
    score.setProgress(local, 1 - clamp01((local - EXIT_FROM) / (1 - EXIT_FROM)));

    const settled = playhead.current === target.current;
    // Scrolled past and settled: the sticky container has released and there
    // is nothing on screen to draw. Costs one comparison instead of a frame.
    if (settled && target.current > 0.9995) return;

    playhead.current = damp(playhead.current, target.current, PLAYHEAD_TAU, frame.dt);
    const p = playhead.current;

    painter.current?.(frame.time, frame.dt);

    // The type resolves *with* the camera rather than after it: while the
    // threshold is being crossed the first beat rises into place, so the
    // headline arrives as part of the move instead of appearing once it lands.
    const arrival = easeOutCubic(cinema ? cinema.entry.value : 1);

    // Overlays are written straight to the DOM. Calling setState here would
    // re-render the whole hero sixty times a second and eat the frame budget
    // the sequence needs.
    for (let i = 0; i < BEATS.length; i += 1) {
      const el = beatRefs.current[i];
      if (!el) continue;
      const o = beatOpacity(p, i) * arrival;
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0, ${beatShift(p, i) + (1 - arrival) * 30}px, 0)`;
      // Links only take clicks while their beat is actually legible.
      el.style.pointerEvents = o > 0.55 ? "auto" : "none";
    }

    if (exitRef.current) {
      const t = Math.max(0, (p - EXIT_FROM) / (1 - EXIT_FROM));
      exitRef.current.style.opacity = String(t * t);
    }
    if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p / 0.08));
    if (barRef.current) barRef.current.style.width = `${p * 100}%`;
    if (readoutRef.current) {
      readoutRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
    }
    // The doorway glows from inside until the camera is through it.
    if (bloomRef.current && cinema) {
      bloomRef.current.style.opacity = String((1 - easeOutCubic(cinema.entry.value)) * 0.9);
    }
  });

  useEffect(() => () => score.dispose(), [score]);

  const toggleSound = () => {
    score.toggle();
    setSoundOn(score.isOn);
  };

  const pct = Math.round((loaded / heroManifest.total) * 100);
  const beats = [
    <BeatOne key="1" {...content} />,
    <BeatTwo key="2" {...content} />,
    <BeatThree key="3" {...content} />,
    <BeatFour key="4" {...content} />,
  ];

  if (reduced) {
    return (
      <section className="relative flex h-[100svh] items-end overflow-hidden bg-void md:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${heroManifest.tiers.hd.dir}/0001.${heroManifest.ext}`}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="relative w-full px-5 pb-24 md:px-10 md:pb-0 lg:px-20">
          <div className="max-w-[min(90vw,720px)]">
            <BeatOne {...content} />
            <div className="mt-8">
              <BeatTwo {...content} />
            </div>
            <div className="mt-8">
              <BeatThree {...content} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={stageRef}
      data-stage="passage"
      style={{ height: `${SCRUB_VH}vh` }}
      className="relative bg-void"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />

        {/*
          The light on the other side of the door. It is at full strength while
          the curtain is still up and burns off as the camera moves through, so
          the cut from film to scene is a move rather than a dissolve.
        */}
        <div
          ref={bloomRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0,
            background:
              "radial-gradient(52% 46% at 50% 46%, rgb(227 196 138 / 0.5), rgb(196 120 60 / 0.16) 45%, transparent 72%)",
          }}
        />

        {/* Grades the daylight footage into the site's palette at the edges. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 40%, transparent 35%, rgb(5 2 3 / 0.62) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-72"
          style={{ background: "linear-gradient(180deg, transparent, var(--color-void))" }}
        />

        {/* Beats share one anchor so they replace each other in the same spot. */}
        <div className="pointer-events-none absolute inset-0 flex items-end px-5 pb-28 md:items-center md:px-10 md:pb-0 lg:px-20">
          <div className="relative w-full max-w-[min(90vw,720px)]">
            {beats.map((node, i) => (
              <div
                key={i}
                ref={(el) => {
                  beatRefs.current[i] = el;
                }}
                className={i === 0 ? "" : "absolute inset-x-0 top-0"}
                style={{ opacity: 0, willChange: "opacity, transform" }}
              >
                {node}
              </div>
            ))}
          </div>
        </div>

        {/*
          The scene dissolves to black over the last stretch of the timeline.
          Without this the sticky container simply unpins and the next section
          snaps into place, which reads as a dropped cut.
        */}
        <div
          ref={exitRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-void"
          style={{ opacity: 0 }}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-void">
            <div className="w-48 text-center">
              <div className="h-px w-full bg-line-2">
                <div
                  className="h-px bg-accent transition-[width] duration-300"
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>
              <p className="label mt-4 text-[10px]">Sahna yuklanmoqda</p>
            </div>
          </div>
        )}

        <div
          ref={cueRef}
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2"
          style={{ opacity: 0 }}
        >
          <span className="label text-[10px]">Vaqtni siz boshqarasiz</span>
          <span aria-hidden className="h-10 w-px overflow-hidden bg-line-2">
            <span className="block h-3 w-px animate-[cue_2.2s_ease-in-out_infinite] bg-accent" />
          </span>
        </div>

        <div className="absolute right-4 bottom-6 flex items-center gap-3 md:right-8">
          <span ref={readoutRef} className="label hidden text-[10px] tabular-nums sm:inline">
            000
          </span>
          <span aria-hidden className="hidden h-px w-24 bg-line-2 sm:block">
            <span ref={barRef} className="block h-px bg-accent" style={{ width: "0%" }} />
          </span>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="inline-flex h-9 items-center rounded-full border border-line-2 bg-[rgb(5_2_3/0.5)] px-3.5 text-[11px] tracking-[0.08em] text-ts uppercase backdrop-blur transition-colors hover:border-accent hover:text-tp"
          >
            {soundOn ? "Ovoz · scroll" : "Ovoz"}
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
