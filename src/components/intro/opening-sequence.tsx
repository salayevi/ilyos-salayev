"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { framePath, heroManifest } from "@/lib/hero-manifest";
import { pickTier } from "@/components/hero/frame-sequence";

/**
 * Opening sequence: the site's front door.
 *
 * The film and the score have to begin on the *same* user gesture — browsers
 * only unlock media playback inside the click handler, and starting them in
 * separate ticks is exactly how you get audio a beat behind picture. So both
 * `play()` calls are issued synchronously from the button press.
 *
 * The overlay never reveals a black frame: the hero's own frames are fetched
 * while the film runs, and the curtain only lifts once they are warm. The score
 * outlives the curtain, fading out on its own at the end of the track.
 */

const SEEN_KEY = "obsidian.intro.seen";
const FADE_OUT_SECONDS = 3.2;
const CURTAIN_MS = 1300;
/** Frames the hero needs before we are willing to hand over. */
const COARSE_STRIDE = 8;

type Phase = "idle" | "playing" | "curtain" | "gone";

export function OpeningSequence() {
  const [stage, setStage] = useState<Exclude<Phase, "gone">>("idle");
  const [heroWarm, setHeroWarm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [filmEnded, setFilmEnded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  // Whether the curtain applies at all is external state (a media query plus a
  // session flag), so it is read rather than mirrored into state from an effect.
  // Server snapshot is `true` on purpose: the very first paint must already be
  // the curtain, otherwise the page flashes into view before the film covers
  // it. React renders the server snapshot through hydration and then swaps in
  // the client value, so a returning visitor loses the curtain a frame later —
  // a far better trade than every first-time visitor seeing the site leak
  // through.
  const firstVisit = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(SEEN_KEY) === null,
    () => true,
  );
  // The curtain lifting is derivable from the two async signals converging,
  // so it is computed rather than pushed into state from an effect.
  const curtainUp = stage === "playing" && filmEnded && heroWarm;
  const phase: Phase = !firstVisit || reduced || dismissed
    ? "gone"
    : curtainUp
      ? "curtain"
      : stage;

  // Nothing behind the curtain may scroll or take focus.
  useEffect(() => {
    if (phase !== "idle" && phase !== "playing") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  /** Warms the frames the hero will ask for first, so the handover is seamless. */
  const warmHero = useCallback(async () => {
    const { tier } = pickTier(heroManifest);
    const wanted: number[] = [];
    for (let i = 0; i < heroManifest.total; i += COARSE_STRIDE) wanted.push(i);
    wanted.push(heroManifest.total - 1);

    await Promise.all(
      wanted.map(
        (i) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "async";
            // A failed frame must not hold the curtain shut.
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = framePath(tier, i);
          }),
      ),
    );
    setHeroWarm(true);
  }, []);

  const start = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    setStage("playing");
    void warmHero();

    // Same tick, same gesture — this is what keeps them locked together.
    audio.currentTime = 0;
    video.currentTime = 0;
    void audio.play().catch(() => {});
    void video.play().catch(() => {});
  };

  const skip = () => {
    sessionStorage.setItem(SEEN_KEY, "1");
    videoRef.current?.pause();
    audioRef.current?.pause();
    setDismissed(true);
  };

  // Once the curtain is up, hold it for the crossfade then drop the overlay.
  useEffect(() => {
    if (!curtainUp) return;
    sessionStorage.setItem(SEEN_KEY, "1");
    const t = window.setTimeout(() => setDismissed(true), CURTAIN_MS);
    return () => window.clearTimeout(t);
  }, [curtainUp]);

  const onVideoEnded = () => {
    // Hold the last frame rather than letting the element go blank.
    videoRef.current?.pause();
    setFilmEnded(true);
  };

  // The score outlives the curtain and fades itself out at the end.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || phase === "gone") return;

    let raf = 0;
    const tick = () => {
      const left = audio.duration - audio.currentTime;
      if (Number.isFinite(left)) {
        audio.volume = left < FADE_OUT_SECONDS ? Math.max(0, left / FADE_OUT_SECONDS) : 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const visible = phase === "idle" || phase === "playing" || phase === "curtain";

  return (
    <>
      {/*
        The audio element is deliberately outside the curtain's conditional so
        that unmounting the overlay never cuts the score mid-bar.
      */}
      <audio ref={audioRef} src="/intro/score.m4a" preload="auto" playsInline />

      {visible && (
        <div
          ref={rootRef}
          className="fixed inset-0 z-100 bg-void transition-opacity ease-out"
          style={{
            opacity: phase === "curtain" ? 0 : 1,
            transitionDuration: `${CURTAIN_MS}ms`,
            cursor: phase === "playing" ? "none" : "auto",
            pointerEvents: phase === "curtain" ? "none" : "auto",
          }}
          role={phase === "idle" ? "dialog" : undefined}
          aria-modal={phase === "idle" ? true : undefined}
          aria-label="Kirish sahnasi"
        >
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover"
            poster="/intro/poster.webp"
            preload="auto"
            muted
            playsInline
            onEnded={onVideoEnded}
          >
            <source src="/intro/loading-720.mp4" type="video/mp4" media="(max-width: 900px)" />
            <source src="/intro/loading.mp4" type="video/mp4" />
          </video>

          {/* Keeps the type legible over whatever the film is doing. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(110% 80% at 50% 50%, rgb(5 6 7 / 0.35), rgb(5 6 7 / 0.82))",
              opacity: phase === "idle" ? 1 : 0,
              transition: "opacity 900ms ease-out",
            }}
          />

          {phase === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="label text-[10px] md:text-xs">Ilyos Salayev</p>
              <p className="mt-5 font-display text-[40px] leading-[1.05] tracking-[-0.03em] text-balance md:text-7xl">
                Bu portfolio emas.
                <br />
                <span className="text-gold-300">Bu — sahna.</span>
              </p>

              <button
                type="button"
                onClick={start}
                autoFocus
                className="mt-10 inline-flex h-13 items-center rounded-full bg-gold px-8 text-[13px] font-medium tracking-[0.14em] text-void uppercase transition-colors hover:bg-gold-300"
              >
                Start experience
              </button>

              <button
                type="button"
                onClick={skip}
                className="mt-5 text-[12px] tracking-[0.08em] text-tt uppercase transition-colors hover:text-ts"
              >
                O&apos;tkazib yuborish
              </button>
            </div>
          )}

          {phase === "playing" && filmEnded && !heroWarm && (
            <div className="absolute inset-x-0 bottom-10 flex justify-center">
              <p className="label text-[10px]">Sahna tayyorlanmoqda</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
