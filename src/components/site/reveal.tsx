"use client";

import { useEffect, useRef } from "react";

import { useCinema } from "@/components/cinema/use-cinema";
import { useReducedMotion } from "@/components/cinema/use-reduced-motion";
import { damp, easeOutCubic, norm } from "@/lib/cinema/easing";

/**
 * Content resolving out of the atmosphere as the camera reaches it.
 *
 * This used to be a one-shot `IntersectionObserver` that fired once and
 * disconnected — the reasoning being that re-animating on scroll-up makes a
 * site feel cheap. That reasoning holds for a *replay*: an animation that
 * restarts on a trigger, on its own clock, regardless of where you are. It
 * does not hold for a *scrub*, which is what this is now. The settle is a pure
 * function of where the element sits relative to the viewport, so running the
 * page backwards retraces it exactly, at the speed of your own hand, the way a
 * timeline does. Nothing replays, because nothing has a clock to replay on.
 *
 * Three things keep it cheap at thirty-odd instances a page:
 *
 * - Geometry comes from `RectBook`, measured on reflow. No element reads its
 *   own rect inside the loop, so there is no layout thrash.
 * - A frame that would write the same value it wrote last time writes nothing.
 *   On any given frame only the two or three elements actually crossing the
 *   band do any work at all.
 * - The blur is dropped — to `none`, not to `blur(0)` — as soon as it stops
 *   being visible, along with the `will-change` hint. A settled page carries no
 *   filter passes and no leftover compositing layers.
 */

/** Fractions of the viewport height at which the settle starts and finishes. */
const ENTER_AT = 0.96;
const SETTLE_AT = 0.62;
/** Pixels of stagger per millisecond of declared delay. */
const STAGGER = 0.3;
/** Weight. Low enough to track a fast scrub, high enough to feel like a camera. */
const TAU = 0.13;
/** Past this the blur is under a pixel — visually nothing, but still a filter pass. */
const BLUR_UNTIL = 0.82;

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const cinema = useCinema();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !cinema || reduced) {
      // No timeline to hang off, or motion is unwanted: show it and stop.
      el?.classList.add("in");
      return;
    }

    const { box, release } = cinema.rects.observe(el);
    let current = 0;
    let written = NaN;
    let staged = false;

    const unsubscribe = cinema.onFrame((frame) => {
      const vh = frame.viewportHeight;
      const offset = delay * STAGGER;
      // The band is expressed in scroll positions rather than viewport
      // coordinates, so progress is a plain function of `scrollY` and the one
      // measured `top` — no per-frame geometry, and exactly reversible.
      const from = box.top - vh * ENTER_AT + offset;
      const to = box.top - vh * SETTLE_AT + offset;

      current = damp(current, norm(frame.scrollY, from, to), TAU, frame.dt);
      if (current === written) return;
      written = current;

      const t = easeOutCubic(current);
      const style = el.style;
      const inFlight = current > 0.0005 && current < 0.9995;

      if (inFlight !== staged) {
        staged = inFlight;
        style.willChange = inFlight ? "opacity, transform, filter, clip-path" : "";
      }

      style.opacity = String(t);
      style.transform = `scale(${(0.975 + 0.025 * t).toFixed(4)})`;

      if (inFlight && t < BLUR_UNTIL) {
        style.filter = `blur(${((1 - t) * 10).toFixed(2)}px)`;
        style.clipPath = `inset(${((1 - t) * 8).toFixed(2)}% 0 0 round 16px)`;
      } else {
        style.filter = "none";
        style.clipPath = t > 0.5 ? "none" : "inset(8% 0 0 round 16px)";
      }
    });

    return () => {
      unsubscribe();
      release();
    };
  }, [cinema, reduced, delay]);

  return (
    // `.reveal` carries the hidden starting state so nothing flashes before the
    // first frame, and the reduced-motion rule in `globals.css` neutralises the
    // whole thing for visitors who asked for that. The CSS transition is turned
    // off here because this element is now driven a frame at a time; leaving it
    // on would put a second, slower easing on top of the scrub.
    <div ref={ref} className={`reveal ${className}`} style={{ transition: "none" }}>
      {children}
    </div>
  );
}
