/**
 * The site's single animation loop.
 *
 * Before this there were four: the hero's scrub loop, the nav's scroll loop,
 * the intro's volume-fade loop, and one `IntersectionObserver` per reveal.
 * Four loops cannot agree on what frame it is, and the hero's read
 * `getBoundingClientRect()` on every one of them, which forces a synchronous
 * layout sixty times a second.
 *
 * So: one `requestAnimationFrame`, one scroll read at the top of it, then
 * every subscriber in registration order. Subscribers are expected to *write*
 * only — transforms, opacities, canvas draws. Anything that needs geometry
 * reads it from `RectBook`, which measures on resize rather than per frame.
 * Reads-then-writes, once, is the difference between 60fps and a stutter.
 */

export type Frame = {
  /** Seconds since the loop started. */
  readonly time: number;
  /** Seconds since the previous frame, clamped so a backgrounded tab cannot jump the world. */
  readonly dt: number;
  readonly scrollY: number;
  /** Pixels scrolled since the previous frame. Negative going up. */
  readonly scrollDelta: number;
  readonly viewportHeight: number;
};

type Subscriber = (frame: Frame) => void;

/** A tab that has been hidden for a minute must not resume with a 60s delta. */
const MAX_DT = 1 / 15;

export class Ticker {
  private subscribers: Subscriber[] = [];
  private raf = 0;
  private startedAt = 0;
  private prev = 0;
  private lastScrollY = 0;
  private running = false;

  /** @returns an unsubscribe function. */
  add(fn: Subscriber): () => void {
    this.subscribers.push(fn);
    return () => {
      const i = this.subscribers.indexOf(fn);
      if (i >= 0) this.subscribers.splice(i, 1);
    };
  }

  start() {
    if (this.running || typeof window === "undefined") return;
    this.running = true;
    this.startedAt = performance.now();
    this.prev = this.startedAt;
    this.lastScrollY = window.scrollY;
    document.addEventListener("visibilitychange", this.onVisibility);
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibility);
    }
  }

  private onVisibility = () => {
    // Coming back from a hidden tab, reset the clock so `dt` describes this
    // frame rather than the length of the visitor's coffee break.
    if (!document.hidden) this.prev = performance.now();
  };

  private tick = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);

    // A hidden tab still gets the occasional frame in some browsers. Skip the
    // work rather than burning battery drawing what nobody is looking at.
    if (document.hidden) {
      this.prev = now;
      return;
    }

    const dt = Math.min((now - this.prev) / 1000, MAX_DT);
    this.prev = now;

    const scrollY = window.scrollY;
    const frame: Frame = {
      time: (now - this.startedAt) / 1000,
      dt,
      scrollY,
      scrollDelta: scrollY - this.lastScrollY,
      viewportHeight: window.innerHeight,
    };
    this.lastScrollY = scrollY;

    // A throwing subscriber must not take the whole site's motion down with
    // it; the rest of the frame still deserves to render.
    for (const fn of this.subscribers) {
      try {
        fn(frame);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") console.error("[cinema] subscriber", error);
      }
    }
  };
}
