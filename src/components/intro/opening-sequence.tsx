"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCinema } from "@/components/cinema/use-cinema";
import { useReducedMotion } from "@/components/cinema/use-reduced-motion";
import { framePath, heroManifest } from "@/lib/hero-manifest";
import { pickTier } from "@/components/hero/frame-sequence";

/**
 * Act I — the invocation.
 *
 * This is no longer a separate system with an ending. It is the first stretch
 * of the master timeline, and the playhead it advances is the same one the
 * hero and the score read. The film's own `currentTime` drives it, because the
 * footage has an edit of its own and scrubbing an mp4 is unreliable on iOS;
 * everything after is driven by scroll. Both move the *same* playhead, so the
 * changeover is a change of input rather than a handover between systems —
 * which is why the score does not restart and the world does not begin again
 * at zero.
 *
 * The film and the score still have to begin on the *same* user gesture:
 * browsers only unlock media playback inside the click handler, and starting
 * them in separate ticks is exactly how you get audio a beat behind picture.
 * So the conductor is built, and both `play()` calls issued, synchronously
 * from the button press.
 *
 * The curtain never reveals a black frame: the hero's own frames are fetched
 * while the film runs, and it only lifts once they are warm.
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

const CURTAIN_MS = 1300;
/** Frames the hero needs before we are willing to hand over. */
const COARSE_STRIDE = 8;

type Phase = "idle" | "playing" | "curtain" | "gone";

export function OpeningSequence() {
  const cinema = useCinema();

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

  const reduced = useReducedMotion();

  // The curtain lifting is derivable from the two async signals converging,
  // so it is computed rather than pushed into state from an effect.
  const curtainUp = stage === "playing" && filmEnded && heroWarm;
  const phase: Phase =
    !enteredAtHome || reduced || dismissed ? "gone" : curtainUp ? "curtain" : stage;

  // Before the visitor commits, the playhead belongs to nobody and is parked
  // at zero. Without this the timeline would read scroll position 0 as the
  // start of Act II and the world would already be through the door.
  //
  // Strictly `idle`, never `playing`: from the gesture onwards the film owns
  // the playhead, and re-parking it as the phase changes would take that back.
  const showing = phase === "idle" || phase === "playing";
  useEffect(() => {
    if (!cinema) return;
    if (phase === "idle") cinema.hold();
    else if (phase === "gone") cinema.skipToScrub();
  }, [cinema, phase]);

  // Nothing behind the curtain may scroll or take focus.
  useEffect(() => {
    if (!showing || !cinema) return;
    window.scrollTo(0, 0);
    cinema.lockScroll(true);
    return () => cinema.lockScroll(false);
  }, [showing, cinema]);

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

  /** Tears down the stall guard; set when playback starts. */
  const guardRef = useRef<(() => void) | null>(null);
  const skipRef = useRef<(() => void) | null>(null);

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
    if (!video || !audio || !cinema) return;

    setStage("playing");
    void warmHero();

    /*
      The way out when the film never arrives.

      Everything below is best-effort: `play()` can be refused, a video can
      stall mid-buffer on a bad connection, and a `<video>` that never fires
      `ended` leaves the sequence waiting forever behind a full-screen overlay
      with the site unreachable underneath. Escape and the skip button already
      existed, but both require the visitor to work out that the thing is
      broken and that leaving is their job.

      This gives up on their behalf. The window is generous — longer than the
      film — so a slow but working connection is never cut off; it only fires
      when nothing is going to happen at all. `timeupdate` proves frames are
      actually advancing, which a `canplay` that never progresses does not.
    */
    let lastProgress = Date.now();
    const onProgress = () => {
      lastProgress = Date.now();
    };
    video.addEventListener("timeupdate", onProgress);

    const guard = window.setInterval(() => {
      // Stalled for eight seconds with no frame advance, or refused outright.
      if (Date.now() - lastProgress > 8000) {
        window.clearInterval(guard);
        video.removeEventListener("timeupdate", onProgress);
        console.warn("[intro] media javob bermadi — sahna o'tkazib yuborildi");
        skipRef.current?.();
      }
    }, 1000);

    const stop = () => {
      window.clearInterval(guard);
      video.removeEventListener("timeupdate", onProgress);
    };
    video.addEventListener("ended", stop, { once: true });
    video.addEventListener("error", () => {
      stop();
      skipRef.current?.();
    }, { once: true });
    guardRef.current = stop;

    // Same tick, same gesture — browsers only unlock media inside the click
    // handler, and starting them in separate ticks is how you get audio a beat
    // behind picture.
    audio.currentTime = 0;
    video.currentTime = 0;
    void audio.play().catch(() => {});
    cinema.startFilm(video);
    void video.play().catch(() => {});

    void tryLandscape();
  };

  const skip = useCallback(() => {
    guardRef.current?.();
    guardRef.current = null;
    videoRef.current?.pause();
    audioRef.current?.pause();
    releaseLandscape();
    setDismissed(true);
  }, [releaseLandscape]);

  // `start` is declared above `skip` and needs to call it; a ref breaks the
  // cycle without reordering the file or widening either one's dependencies.
  useEffect(() => {
    skipRef.current = skip;
  }, [skip]);

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

  /*
    The threshold is crossed here.

    `enterScrub` fires as the curtain *starts* to lift, not after: the camera
    push into the hero, the doorway bloom burning off, the ember field coming
    up and the score crossfading from transport to scrub all run underneath the
    fading film. That overlap is the difference between a cut and a move.
  */
  useEffect(() => {
    if (!curtainUp || !cinema) return;
    releaseLandscape();
    cinema.enterScrub();
    const t = window.setTimeout(() => setDismissed(true), CURTAIN_MS);
    return () => window.clearTimeout(t);
  }, [curtainUp, cinema, releaseLandscape]);

  const onVideoEnded = () => {
    // Hold the last frame rather than letting the element go blank. The intro's
    // soundtrack ends here, as it does in the committed baseline; the hero's
    // music is a separate asset on a separate controller.
    videoRef.current?.pause();
    audioRef.current?.pause();
    setFilmEnded(true);
  };

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
          className="fixed inset-0 z-100 bg-void ease-out"
          style={{
            opacity: phase === "curtain" ? 0 : 1,
            // The film plane pushes past the camera as it dissolves, so the
            // eye reads forward motion rather than a fade.
            transform: phase === "curtain" ? "scale(1.06)" : "scale(1)",
            transition: `opacity ${CURTAIN_MS}ms var(--ease-cinematic), transform ${CURTAIN_MS + 300}ms var(--ease-cinematic)`,
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
                "radial-gradient(110% 80% at 50% 50%, rgb(5 2 3 / 0.35), rgb(5 2 3 / 0.82))",
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
                <span className="text-crimson-100">Bu — sahna.</span>
              </p>

              <button
                type="button"
                onClick={start}
                autoFocus
                className="mt-10 inline-flex h-13 items-center rounded-full bg-accent px-8 text-[13px] font-medium tracking-[0.14em] text-tp uppercase transition-colors hover:bg-accent-hover"
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
