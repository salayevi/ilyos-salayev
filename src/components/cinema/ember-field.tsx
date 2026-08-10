"use client";

import { useEffect, useRef } from "react";

import { clamp, clamp01, smoothstep } from "@/lib/cinema/easing";
import { ACTS } from "@/lib/cinema/score";
import { useCinema } from "./use-cinema";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Atmosphere, not weather.
 *
 * The brief asked for a dragon that is never actually in the room: warmth,
 * embers, the sense that something further in is giving off heat. So this is
 * a few dozen slow motes of gold and ember over the whole frame, brightest as
 * the door opens and fading back as the visitor settles into reading.
 *
 * Two decisions keep it from costing anything:
 *
 * - No `filter: blur()` and no `mix-blend-mode`. A full-viewport blend layer
 *   forces the compositor to re-blend the entire page every frame. Instead the
 *   soft edge is baked once into a sprite and the additive look comes from
 *   `globalCompositeOperation = "lighter"` *inside* the canvas, where it costs
 *   only the pixels actually drawn.
 * - It runs on the shared ticker, so it adds no loop of its own, and it stops
 *   drawing entirely whenever it would be invisible.
 */

/** Below this the field is behind the opening curtain — nothing to light. */
const WAKE_AT = ACTS.invocation.to * 0.55;

type Ember = {
  x: number;
  y: number;
  radius: number;
  rise: number;
  sway: number;
  phase: number;
  alpha: number;
  warm: number;
};

/** A soft dot, rasterised once and blitted thereafter. */
function makeSprite(size: number, inner: string, outer: string) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, inner);
  // The falloff starts early and runs long. A late stop leaves a hard core and
  // the motes read as dust on the lens rather than as light in the room.
  gradient.addColorStop(0.28, outer);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export function EmberField() {
  const cinema = useCinema();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cinema || reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const lean = (nav.deviceMemory ?? 8) <= 4;

    const gold = makeSprite(64, "rgba(245,230,200,0.8)", "rgba(200,169,106,0.2)");
    const ember = makeSprite(64, "rgba(255,190,140,0.72)", "rgba(196,86,44,0.17)");

    let width = 0;
    let height = 0;
    let embers: Ember[] = [];

    const seed = (e: Ember, spawnAnywhere: boolean) => {
      e.x = Math.random() * width;
      e.y = spawnAnywhere ? Math.random() * height : height + Math.random() * 80;
      e.radius = 1.1 + Math.random() * 3.4;
      e.rise = 7 + Math.random() * 20;
      e.sway = 6 + Math.random() * 16;
      e.phase = Math.random() * Math.PI * 2;
      e.alpha = 0.12 + Math.random() * 0.3;
      // Mostly gold dust with the occasional live ember, so the warmth reads
      // as firelight rather than as a particle effect.
      e.warm = Math.random() < 0.24 ? 1 : 0;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === width && h === height) return;
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wanted = clamp(Math.round(w / 26), 16, lean ? 26 : 52);
      const spawnAnywhere = embers.length === 0;
      embers = Array.from({ length: wanted }, (_, i) => {
        const existing = embers[i];
        if (existing) return existing;
        const e: Ember = { x: 0, y: 0, radius: 0, rise: 0, sway: 0, phase: 0, alpha: 0, warm: 0 };
        seed(e, spawnAnywhere);
        return e;
      });
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    let heat = 0;
    let painted = false;

    const unsubscribe = cinema.onFrame((frame, timeline) => {
      const t = timeline.time;

      // How much of the world is alight. Nothing before the door, a surge as
      // the camera crosses it, then a long settle so reading is not a fireworks
      // display. Scroll speed lifts it a little, so motion has warmth.
      const woken = smoothstep(clamp01((t - WAKE_AT) / (ACTS.passage.from - WAKE_AT)));
      const entry = cinema.entry.value;
      const surge = smoothstep(entry) * (1 - smoothstep(clamp01((entry - 0.55) / 0.45))) * 0.55;
      const settle = 0.34 + 0.26 * smoothstep(clamp01((t - ACTS.passage.from) / 6));
      const speed = clamp01(Math.abs(timeline.velocity) / 6) * 0.22;
      const target = woken * (settle + surge + speed);

      heat += (target - heat) * Math.min(1, frame.dt * 2.6);

      if (heat < 0.004) {
        // Clear once on the way out, then stop touching the canvas at all.
        if (painted) {
          ctx.clearRect(0, 0, width, height);
          painted = false;
        }
        return;
      }
      painted = true;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      // A slow, non-repeating swell — the room breathing rather than a loop.
      const pulse = 0.86 + 0.09 * Math.sin(frame.time * 0.61) + 0.05 * Math.sin(frame.time * 0.23);
      // Scrolling drags the field past the camera, so the atmosphere belongs
      // to the world rather than to the screen.
      const drag = frame.scrollDelta * 0.05;

      for (const e of embers) {
        e.y -= e.rise * frame.dt;
        e.y += drag;
        e.phase += frame.dt * 0.5;
        if (e.y < -40 || e.y > height + 120) seed(e, false);

        const x = e.x + Math.sin(e.phase) * e.sway;
        const flicker = 0.78 + 0.22 * Math.sin(e.phase * 2.3);
        const size = e.radius * 8;
        ctx.globalAlpha = clamp01(e.alpha * heat * pulse * flicker);
        ctx.drawImage(e.warm ? ember : gold, x - size / 2, e.y - size / 2, size, size);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
    };
  }, [cinema, reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Above the page, below the navigation, the menu sheet and the opening
      // curtain — so the embers are revealed *by* the curtain lifting rather
      // than drawn on top of it.
      className="pointer-events-none fixed inset-0 z-30"
    />
  );
}
