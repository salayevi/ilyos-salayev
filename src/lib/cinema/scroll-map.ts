import type { Measured } from "./rects";
import { STAGE_ACTS, STAGE_ORDER, SCRUB_FROM } from "./score";

/**
 * Turns scroll position into timeline seconds.
 *
 * A flat `scrollY / maxScroll` would work but reads badly: the hero is 520vh
 * of deliberately slow footage and the sections below it are ordinary reading
 * length, so a single ratio spends most of the soundtrack on the door and
 * rushes everything after. Instead the page drops *anchors* — see
 * `components/cinema/stage.tsx` — and each anchor opens a stage that runs to
 * the next one and owns a fixed slice of the score. Scroll distance inside a
 * stage maps linearly onto its slice.
 *
 * The result is a piecewise-linear, continuous, strictly increasing function.
 * Continuous so the score never jumps; increasing so scrolling up always
 * rewinds and never stalls.
 */

export type StageInput = { name: string; box: Measured };

type Point = { y: number; t: number };

export class ScrollMap {
  private points: Point[] = [];

  build(stages: StageInput[], viewportHeight: number, maxScroll: number) {
    const ordered = STAGE_ORDER.map((name) => stages.find((s) => s.name === name)).filter(
      (s): s is StageInput => Boolean(s),
    );

    if (ordered.length === 0) {
      this.points = [];
      return;
    }

    const points: Point[] = [];
    let y = Math.max(0, ordered[0].box.top);
    let t = STAGE_ACTS[ordered[0].name]?.from ?? SCRUB_FROM;
    points.push({ y, t });

    ordered.forEach((stage, i) => {
      const act = STAGE_ACTS[stage.name];
      if (!act) return;

      const next = ordered[i + 1];
      // A stage is spent when the *next* chapter mark reaches the bottom of
      // the viewport. For the hero that is exactly the scroll position where
      // its sticky container releases, so the last frame of the door lands on
      // the last frame of the act.
      let exit = next
        ? next.box.top - viewportHeight
        : // The final stage runs to the true end of the document, so the score
          // resolves on the last pixel of the page rather than above the footer.
          maxScroll;
      // Guarantees a strictly increasing domain even if a stage collapses to
      // nothing — an empty section, an image that has not arrived yet.
      exit = Math.max(exit, y + 1);

      y = exit;
      t = Math.max(t, act.to);
      points.push({ y, t });
    });

    this.points = points;
  }

  timeAt(scrollY: number): number {
    const points = this.points;
    if (points.length === 0) return SCRUB_FROM;

    const first = points[0];
    if (scrollY <= first.y) return first.t;

    const last = points[points.length - 1];
    if (scrollY >= last.y) return last.t;

    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      if (scrollY <= b.y) {
        const span = b.y - a.y;
        const local = span > 0 ? (scrollY - a.y) / span : 0;
        return a.t + (b.t - a.t) * local;
      }
    }
    return last.t;
  }
}
