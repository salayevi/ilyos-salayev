import { framePath, type HeroManifest, type HeroTier } from "@/lib/hero-manifest";

/**
 * Loads and decodes a cinematic frame sequence for scroll scrubbing.
 *
 * Design notes, because the obvious implementations both fail:
 *
 * - `ImageBitmap` for every frame is tempting (off-thread decode, cheap draw)
 *   but it pins raw pixels: 1280x720 RGBA is 3.7 MB *per frame*, so 134 frames
 *   would hold ~500 MB and get the tab killed on mobile. `HTMLImageElement`
 *   keeps only the compressed bytes resident and lets the browser evict decoded
 *   copies under pressure, so that is what we hold.
 *
 * - Decoding lazily inside the draw loop stalls the first paint of each new
 *   frame. Instead we `decode()` a moving window around the playhead, so the
 *   frames the user is about to reach are already rasterised.
 *
 * Loading runs in two phases: a coarse stride first so scrubbing is usable
 * within a few hundred milliseconds, then the gaps, always fetching whatever
 * is nearest the playhead.
 */

const CONCURRENCY = 6;
const COARSE_STRIDE = 8;
const DECODE_WINDOW = 12;

export type SequenceEvents = {
  onProgress?: (loaded: number, total: number) => void;
  onCoarseReady?: () => void;
};

export class FrameSequence {
  readonly total: number;
  private readonly manifest: HeroManifest;
  private readonly tier: HeroTier;
  private readonly images: (HTMLImageElement | undefined)[];
  private readonly ready: boolean[];
  private readonly pending = new Set<number>();
  private readonly decoding = new Set<number>();
  private inFlight = 0;
  private loadedCount = 0;
  private coarseAnnounced = false;
  private playhead = 0;
  private destroyed = false;
  private events: SequenceEvents;

  constructor(manifest: HeroManifest, tier: HeroTier, events: SequenceEvents = {}) {
    this.manifest = manifest;
    this.tier = tier;
    this.total = manifest.total;
    this.events = events;
    this.images = new Array(this.total);
    this.ready = new Array(this.total).fill(false);

    for (let i = 0; i < this.total; i += 1) this.pending.add(i);
  }

  start() {
    this.pump();
  }

  destroy() {
    this.destroyed = true;
    this.pending.clear();
    for (let i = 0; i < this.images.length; i += 1) {
      const img = this.images[i];
      if (img) img.src = "";
      this.images[i] = undefined;
    }
  }

  /** Tells the loader and decoder where the user currently is. */
  setPlayhead(index: number) {
    this.playhead = index;
    this.warmDecodeWindow(index);
  }

  get progress() {
    return this.loadedCount / this.total;
  }

  /**
   * The frame to paint for `index`: the exact one if it is ready, otherwise the
   * closest ready neighbour. Returning a near frame rather than nothing is what
   * keeps the canvas from flashing empty during the first moments.
   */
  frameFor(index: number): HTMLImageElement | null {
    const clamped = Math.max(0, Math.min(this.total - 1, Math.round(index)));
    if (this.ready[clamped]) return this.images[clamped] ?? null;

    for (let d = 1; d < this.total; d += 1) {
      const lo = clamped - d;
      const hi = clamped + d;
      if (lo >= 0 && this.ready[lo]) return this.images[lo] ?? null;
      if (hi < this.total && this.ready[hi]) return this.images[hi] ?? null;
    }
    return null;
  }

  /** Coarse pass first, then whatever sits closest to the playhead. */
  private nextIndex(): number | undefined {
    let best: number | undefined;
    let bestScore = Infinity;

    for (const i of this.pending) {
      const coarse = i % COARSE_STRIDE === 0 || i === this.total - 1;
      // Coarse frames outrank fine ones; within a phase, nearest wins.
      const score = (coarse ? 0 : 1_000_000) + Math.abs(i - this.playhead);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  private pump() {
    while (!this.destroyed && this.inFlight < CONCURRENCY) {
      const index = this.nextIndex();
      if (index === undefined) break;
      this.pending.delete(index);
      this.inFlight += 1;
      void this.load(index);
    }
  }

  private async load(index: number) {
    const img = new Image();
    img.decoding = "async";
    img.src = framePath(this.tier, index, this.manifest);

    try {
      await img.decode();
    } catch {
      // A decode failure must not stall the queue; the nearest-neighbour
      // fallback covers the gap and the sequence stays watchable.
      this.inFlight -= 1;
      if (!this.destroyed) this.pump();
      return;
    }

    if (this.destroyed) return;

    this.images[index] = img;
    this.ready[index] = true;
    this.loadedCount += 1;
    this.inFlight -= 1;

    this.events.onProgress?.(this.loadedCount, this.total);

    if (!this.coarseAnnounced && this.coarsePassDone()) {
      this.coarseAnnounced = true;
      this.events.onCoarseReady?.();
    }

    this.pump();
  }

  private coarsePassDone() {
    for (let i = 0; i < this.total; i += COARSE_STRIDE) {
      if (!this.ready[i]) return false;
    }
    return true;
  }

  /**
   * Re-`decode()`s frames around the playhead. If the browser has dropped a
   * decoded copy to reclaim memory this pulls it back before it is drawn,
   * which is the difference between a smooth scrub and a periodic hitch.
   */
  private warmDecodeWindow(center: number) {
    const from = Math.max(0, Math.round(center) - DECODE_WINDOW);
    const to = Math.min(this.total - 1, Math.round(center) + DECODE_WINDOW);

    for (let i = from; i <= to; i += 1) {
      const img = this.images[i];
      if (!img || !this.ready[i] || this.decoding.has(i)) continue;
      this.decoding.add(i);
      img
        .decode()
        .catch(() => {})
        .finally(() => this.decoding.delete(i));
    }
  }
}

/**
 * Picks a tier from the things that actually predict decode cost: how many
 * pixels we must fill, how much memory the device admits to, and whether the
 * user has asked the browser to save data.
 */
export function pickTier(manifest: HeroManifest): { key: "hd" | "sd"; tier: HeroTier } {
  if (typeof window === "undefined") return { key: "hd", tier: manifest.tiers.hd };

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  const saveData = nav.connection?.saveData === true;
  const slowLink = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  const lowMemory = (nav.deviceMemory ?? 8) <= 4;
  const cssWidth = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);

  if (saveData || slowLink || lowMemory || cssWidth < 900) {
    return { key: "sd", tier: manifest.tiers.sd };
  }
  return { key: "hd", tier: manifest.tiers.hd };
}
