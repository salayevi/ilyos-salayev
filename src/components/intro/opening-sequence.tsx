"use client";

import { usePathname } from "next/navigation";
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
 *
 * The curtain is deliberately *not* remembered. It plays on every arrival at
 * the site, because it is the opening of the piece rather than an onboarding
 * step to be got through once — and because a returning visitor showing up
 * mid-scene is the one thing a staged entrance cannot survive. Only the
 * skip button and `prefers-reduced-motion` bypass it, and neither persists.
 *
 * It is scoped to the page the visitor *arrived* on, and only when that page is
 * the home page. A deep link — a shared case study, a listing someone is about
 * to buy — is not an entrance, and covering it with a full-screen film would
 * stand between that visitor and the thing they came for. In-app navigation is
 * likewise unaffected: this lives in the site layout, which stays mounted
 * across client-side route changes, and the entry path is captured once.
 */

const FADE_OUT_SECONDS = 3.2;
const CURTAIN_MS = 1300;
/** Frames the hero needs before we are willing to hand over. */
const COARSE_STRIDE = 8;

type Phase = "idle" | "playing" | "curtain" | "gone";

export function OpeningSequence() {
  // Captured once, on the first render of the session. `usePathname` keeps
  // changing as the visitor navigates; where they came *in* does not.
  const pathname = usePathname();
  const [enteredAtHome] = useState(() => pathname === "/");

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

  // The curtain lifting is derivable from the two async signals converging,
  // so it is computed rather than pushed into state from an effect.
  const curtainUp = stage === "playing" && filmEnded && heroWarm;
  const phase: Phase =
    !enteredAtHome || reduced || dismissed ? "gone" : curtainUp ? "curtain" : stage;

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

  /**
   * Best-effort landscape on phones that allow it.
   *
   * Fired *after* playback starts, never before: the orientation and
   * fullscreen calls are async, and awaiting them first would break the
   * same-gesture rule that keeps picture and sound locked together. iOS
   * refuses both outright, which is fine — the portrait fit above already
   * shows the whole frame.
   */
  const tryLandscape = async () => {
    const root = rootRef.current;
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    if (!root || typeof orientation?.lock !== "function") return;
    try {
      if (!document.fullscreenElement) await root.requestFullscreen?.();
      await orientation.lock("landscape");
    } catch {
      // Unsupported or refused — nothing to recover, the fit handles it.
    }
  };

  const releaseLandscape = useCallback(() => {
    try {
      (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.();
      if (document.fullscreenElement) void document.exitFullscreen?.();
    } catch {
      // Leaving the intro must never throw.
    }
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
    // The hero receives this exact media element after the entrance. It has
    // already been unlocked by the visitor's click, so scroll can resume it
    // without inventing a second, unrelated soundtrack.
    (window as Window & { __obsidianScrollScore?: HTMLAudioElement }).__obsidianScrollScore = audio;
    void audio.play().catch(() => {});
    void video.play().catch(() => {});

    void tryLandscape();
  };

  const skip = useCallback(() => {
    videoRef.current?.pause();
    audioRef.current?.pause();
    releaseLandscape();
    setDismissed(true);
  }, [releaseLandscape]);

  useEffect(() => {
    if (phase !== "idle") return;
    const root = rootRef.current;
    if (!root) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...root.querySelectorAll<HTMLElement>("button:not([disabled])")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [phase, skip]);

  // Once the curtain is up, hold it for the crossfade then drop the overlay.
  useEffect(() => {
    if (!curtainUp) return;
    releaseLandscape();
    const t = window.setTimeout(() => setDismissed(true), CURTAIN_MS);
    return () => window.clearTimeout(t);
  }, [curtainUp, releaseLandscape]);

  const onVideoEnded = () => {
    // Hold the last frame rather than letting the element go blank.
    videoRef.current?.pause();
    // Landing begins silent. The cinematic hero takes the same audio from this
    // exact timestamp and advances it only while the visitor scrolls.
    audioRef.current?.pause();
    window.dispatchEvent(new Event("obsidian:intro-score-ready"));
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
            className="intro-film absolute inset-0 size-full"
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
