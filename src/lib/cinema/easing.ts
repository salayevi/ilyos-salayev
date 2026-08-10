/**
 * Shared maths for the cinema layer.
 *
 * Everything here is frame-rate independent. The old hero eased its playhead
 * with `x += (target - x) * 0.11`, which silently changes its time constant
 * with the display: the same code settles in 140ms on a 60Hz panel and 70ms on
 * a 120Hz one. `damp` takes the time constant in seconds instead, so the
 * weight of the camera is a property of the edit rather than of the hardware.
 */

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Position of `v` inside `[a, b]`, clamped. Returns 0 for a degenerate range. */
export function norm(v: number, a: number, b: number) {
  const span = b - a;
  return span === 0 ? 0 : clamp01((v - a) / span);
}

/**
 * Exponential approach to `target`.
 *
 * @param tau seconds to close ~63% of the remaining distance
 * @param dt  seconds since the previous frame
 */
export function damp(current: number, target: number, tau: number, dt: number) {
  if (tau <= 0) return target;
  const next = target + (current - target) * Math.exp(-dt / tau);
  // Snap once we are within a hair, so a held position lands exactly rather
  // than creeping for ever and forcing a repaint on every frame.
  return Math.abs(target - next) < 1e-4 ? target : next;
}

/** 0 at the edges, 1 across the middle, with `ramp` of the span spent on each fade. */
export function window01(t: number, ramp: number) {
  if (t <= 0 || t >= 1) return 0;
  if (t < ramp) return t / ramp;
  if (t > 1 - ramp) return (1 - t) / ramp;
  return 1;
}

export const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;

export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
