"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";

import { clamp01 } from "@/lib/cinema/easing";
import { RectBook } from "@/lib/cinema/rects";
import { SCORE_DURATION } from "@/lib/cinema/score";
import { ScrollMap } from "@/lib/cinema/scroll-map";
import { MasterTimeline, type Segment } from "@/lib/cinema/timeline";
import { Ticker, type Frame } from "@/lib/cinema/ticker";

/**
 * The projectionist.
 *
 * One playhead, one loop, one soundtrack, for the whole site. Components do
 * not compute where they are — they declare a window on the timeline and are
 * told. That inversion is the entire refactor: as long as nothing keeps its
 * own clock, nothing can drift out of step with anything else.
 *
 * The playhead has two possible inputs and they are never both live:
 *
 *   held  — before the visitor commits. Parked at zero.
 *   film  — the opening sequence. Position is the video's own `currentTime`,
 *           because the footage has an edit that belongs to it and scrubbing
 *           an mp4 is unreliable on iOS.
 *   scrub — everything after. Position is scroll, through the stage map.
 *
 * Handing over is a change of *input*, not a handover between systems. The
 * playhead value is continuous across it, which is why the score does not
 * restart and the world does not begin again at zero.
 */

/** How long the camera takes to cross the threshold once the film ends. */
const ENTRY_MS = 1500;

export type CinemaFrame = (frame: Frame, timeline: MasterTimeline) => void;

export type Cinema = {
  readonly timeline: MasterTimeline;
  readonly rects: RectBook;
  /** Subscribe to the shared loop. Runs after the playhead has been set. */
  onFrame: (fn: CinemaFrame) => () => void;
  addSegment: (segment: Segment) => () => void;
  registerStage: (name: string, el: HTMLElement) => () => void;

  /** 0 outside the door, 1 fully through it. Read per frame, never a state. */
  readonly entry: { value: number };

  /** Parks the playhead at zero while the visitor decides to come in. */
  hold: () => void;
  /**
   * Starts the opening film. The provider drives the playhead from the film's
   * own clock; the film's soundtrack is the intro's own business and this knows
   * nothing about it.
   */
  startFilm: (video: HTMLVideoElement) => void;
  /** The film has ended: hand the playhead to scroll and open the door. */
  enterScrub: () => void;
  /** Skipped, deep-linked, or reduced motion — no film, straight to scroll. */
  skipToScrub: () => void;

  lockScroll: (locked: boolean) => void;
};

export const CinemaContext = createContext<Cinema | null>(null);

/** The provider keeps the loop and the measuring tape; children only get `Cinema`. */
type Projector = { cinema: Cinema; ticker: Ticker; rebuild: () => void };

function createProjector(): Projector {
  const timeline = new MasterTimeline(SCORE_DURATION);
  const scrollMap = new ScrollMap();
  const subscribers: CinemaFrame[] = [];
  const stages: { name: string; box: { top: number; height: number } }[] = [];
  // Starts *through* the door. Most arrivals — a deep link, reduced motion, a
  // client-side navigation — never show the film, and those visitors must not
  // get a hero that is still holding its breath waiting for a threshold that
  // will never be crossed. The opening sequence winds it back to 0 if and only
  // if it is actually going to play.
  const entry = { value: 1 };

  let mode: "held" | "film" | "scrub" = "scrub";
  let video: HTMLVideoElement | null = null;
  let entryStartedAt = 0;
  let scrollLocks = 0;
  let restoreOverflow = "";

  const rebuild = () => {
    if (typeof window === "undefined") return;
    scrollMap.build(stages, window.innerHeight, rects.maxScroll);
    // Geometry moved under the playhead: everything must be re-read at the new
    // mapping, or half the page keeps rendering for the old layout.
    timeline.refresh();
  };

  const rects = new RectBook(rebuild);

  const drive = (frame: Frame) => {
    if (mode === "scrub") {
      timeline.seek(scrollMap.timeAt(frame.scrollY), frame.dt);
    } else if (mode === "film" && video) {
      timeline.seek(video.currentTime, frame.dt);
    } else {
      timeline.seek(0, frame.dt);
    }

    if (entryStartedAt > 0) {
      entry.value = clamp01((performance.now() - entryStartedAt) / ENTRY_MS);
    }

    for (const fn of subscribers) {
      try {
        fn(frame, timeline);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") console.error("[cinema] frame", error);
      }
    }
  };

  const ticker = new Ticker();
  ticker.add(drive);

  const cinema: Cinema = {
    timeline,
    rects,
    entry,

    onFrame(fn) {
      subscribers.push(fn);
      return () => {
        const i = subscribers.indexOf(fn);
        if (i >= 0) subscribers.splice(i, 1);
      };
    },

    addSegment(segment) {
      return timeline.add(segment);
    },

    registerStage(name, el) {
      const { box, release } = rects.observe(el);
      const stage = { name, box };
      stages.push(stage);
      rebuild();
      return () => {
        const i = stages.indexOf(stage);
        if (i >= 0) stages.splice(i, 1);
        release();
        rebuild();
      };
    },

    hold() {
      mode = "held";
      entryStartedAt = 0;
      entry.value = 0;
    },

    startFilm(videoEl) {
      mode = "film";
      video = videoEl;
      entryStartedAt = 0;
      entry.value = 0;
    },

    enterScrub() {
      if (mode === "scrub") return;
      mode = "scrub";
      entryStartedAt = performance.now();
      rebuild();
    },

    skipToScrub() {
      // A visitor who has already come through the door is *in* scrub mode;
      // the overlay unmounting behind them must not re-run this and snap the
      // camera push to its end position mid-move.
      if (mode === "scrub") return;
      mode = "scrub";
      entryStartedAt = 0;
      entry.value = 1;
      rebuild();
    },

    lockScroll(locked) {
      if (typeof document === "undefined") return;
      if (locked) {
        if (scrollLocks === 0) {
          restoreOverflow = document.body.style.overflow;
          document.body.style.overflow = "hidden";
        }
        scrollLocks += 1;
      } else {
        scrollLocks = Math.max(0, scrollLocks - 1);
        if (scrollLocks === 0) document.body.style.overflow = restoreOverflow;
      }
    },

  };

  return { cinema, ticker, rebuild };
}

export function CinemaProvider({ children }: { children: ReactNode }) {
  const [projector] = useState(createProjector);

  useEffect(() => {
    const { cinema, ticker, rebuild } = projector;
    // Layout settles after hydration: fonts swap in, images arrive and push
    // the page down. Measure now, and again once it has quietened.
    rebuild();
    const settle = window.setTimeout(rebuild, 400);
    ticker.start();

    // A window onto the playhead, for checking that the edit lines up. Dead
    // code in a production build, so it costs nothing to ship the hook.
    if (process.env.NODE_ENV !== "production") {
      (window as Window & { __cinema?: unknown }).__cinema = cinema;
    }

    return () => {
      window.clearTimeout(settle);
      ticker.stop();
      cinema.rects.dispose();
    };
  }, [projector]);

  return <CinemaContext.Provider value={projector.cinema}>{children}</CinemaContext.Provider>;
}
