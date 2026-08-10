"use client";

import { useCallback, useContext, useEffect, useEffectEvent, useRef } from "react";

import type { Segment } from "@/lib/cinema/timeline";
import { CinemaContext, type Cinema, type CinemaFrame } from "./cinema-provider";

/**
 * Access to the projectionist.
 *
 * Everything here is deliberately imperative. A scrubbed timeline writes to
 * the DOM sixty times a second, and routing that through React state would
 * re-render the tree on every frame — which is exactly the cost the old hero
 * avoided by hand, and which this keeps avoiding by design. Components read
 * their progress in a callback and write styles directly.
 */

export function useCinema(): Cinema | null {
  return useContext(CinemaContext);
}

/** Runs `fn` on the shared loop, after the playhead has been set for the frame. */
export function useCinemaFrame(fn: CinemaFrame) {
  const cinema = useCinema();
  // An Effect Event, so the subscription is established once and still sees
  // fresh props every frame. Re-subscribing on each render would tear the
  // loop's subscriber list down and rebuild it mid-scroll.
  const onFrame = useEffectEvent(fn);

  useEffect(() => {
    if (!cinema) return;
    return cinema.onFrame((frame, timeline) => onFrame(frame, timeline));
  }, [cinema]);
}

/**
 * Declares a window on the master timeline.
 *
 * `render` is called with local progress whenever the playhead moves inside
 * the window, and exactly once at 0 or 1 when it leaves — so a segment scrolled
 * past backwards resets itself instead of latching on.
 */
export function useSegment(name: string, from: number, to: number, render: Segment["render"]) {
  const cinema = useCinema();
  const onRender = useEffectEvent(render);

  useEffect(() => {
    if (!cinema) return;
    return cinema.addSegment({
      name,
      from,
      to,
      render: (local, ctx) => onRender(local, ctx),
    });
  }, [cinema, name, from, to]);
}

/**
 * Marks an element as a stage: a stretch of scroll that owns a slice of the
 * score. Returns a ref callback to spread onto the element.
 */
export function useStage(name: string) {
  const cinema = useCinema();
  const cleanup = useRef<(() => void) | null>(null);

  // Stable across renders on purpose. An inline ref callback is a new function
  // every render, so React detaches and reattaches it each time — and the hero
  // re-renders on every decoded frame while the sequence loads, which would
  // re-measure the whole page a few hundred times before it settles.
  return useCallback(
    (el: HTMLElement | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (el && cinema) cleanup.current = cinema.registerStage(name, el);
    },
    [cinema, name],
  );
}

