import { clamp } from "./easing";

/**
 * The master timeline.
 *
 * One playhead, measured in seconds of the soundtrack (see `score.ts`). Every
 * animated thing on the page is a segment on it, and a segment only ever
 * renders as a function of the playhead — never of elapsed time, never of its
 * own history. That is what makes the whole page scrub: run the playhead
 * backwards and every segment retraces itself, because there is nothing else
 * for it to read.
 *
 * The one subtlety is *parking*. A segment whose window the playhead has left
 * must be rendered once at its boundary value — 0 going backwards, 1 going
 * forwards — and then left alone. Without that a segment keeps whatever it was
 * showing when you scrolled past, which is precisely how the old
 * `IntersectionObserver` reveals latched on and refused to come back.
 *
 * There is no tweening engine here on purpose. Segments interpolate whatever
 * they own, in whatever units suit them; the timeline's only job is to hand
 * each one an honest local progress and to guarantee the boundary renders.
 */

export type SegmentContext = {
  /** Playhead position, in seconds. */
  readonly time: number;
  /** Playhead speed, in timeline-seconds per wall-second. Negative when reversing. */
  readonly velocity: number;
  /** Seconds since the previous frame. */
  readonly dt: number;
};

export type Segment = {
  /** Diagnostic name, for reading a stack trace back to an act. */
  readonly name: string;
  readonly from: number;
  readonly to: number;
  /**
   * @param local 0..1 across `[from, to]`, clamped.
   * @param ctx   playhead state for this frame.
   */
  render: (local: number, ctx: SegmentContext) => void;
};

type Entry = { segment: Segment; last: number };

export class MasterTimeline {
  readonly duration: number;

  private readonly entries: Entry[] = [];
  private t = 0;
  private v = 0;

  constructor(duration: number) {
    this.duration = duration;
  }

  get time() {
    return this.t;
  }

  get progress() {
    return this.duration > 0 ? this.t / this.duration : 0;
  }

  get velocity() {
    return this.v;
  }

  /** @returns an unsubscribe function. */
  add(segment: Segment): () => void {
    // `NaN` on the first render forces the initial paint even when the segment
    // starts parked at 0 — otherwise a segment mounted below the fold would
    // never write its own opacity and would inherit whatever CSS left behind.
    const entry: Entry = { segment, last: NaN };
    this.entries.push(entry);
    return () => {
      const i = this.entries.indexOf(entry);
      if (i >= 0) this.entries.splice(i, 1);
    };
  }

  /**
   * Moves the playhead and renders every segment that needs it.
   *
   * @param time seconds; clamped to the timeline.
   * @param dt   seconds since the previous seek, for velocity and damping.
   */
  seek(time: number, dt = 0) {
    const next = clamp(time, 0, this.duration);
    this.v = dt > 0 ? (next - this.t) / dt : 0;
    this.t = next;
    this.render(dt);
  }

  /** Re-renders every segment at the current playhead — used after a resize. */
  refresh() {
    for (const entry of this.entries) entry.last = NaN;
    this.render(0);
  }

  private render(dt: number) {
    for (const entry of this.entries) {
      const { segment } = entry;
      const span = segment.to - segment.from;
      const raw = span === 0 ? (this.t >= segment.to ? 1 : 0) : (this.t - segment.from) / span;
      const local = raw < 0 ? 0 : raw > 1 ? 1 : raw;

      // Already parked at this boundary, or genuinely unmoved: nothing to do.
      // This is what keeps a fifty-segment page from writing fifty styles a
      // frame when only two of them are live.
      if (local === entry.last) continue;

      entry.last = local;
      segment.render(local, { time: this.t, velocity: this.v, dt });
    }
  }
}
