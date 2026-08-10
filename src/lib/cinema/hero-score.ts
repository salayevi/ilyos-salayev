import { clamp, clamp01 } from "./easing";
import { FILM_DURATION } from "./score";

/**
 * The passage's soundtrack, as a position on the timeline.
 *
 * The rule is one line: `musicTime = INTRO_END + heroProgress × HERO_SPAN`.
 * Nothing here reads scroll velocity, wheel deltas, elapsed time or request
 * frequency. Progress in, position out.
 *
 * Progress 0 is not the start of the recording — it is the point the intro
 * stopped at. The passage is the same soundtrack continuing, not a second track
 * beginning, and scrolling back to the top of the hero returns to that exact
 * position rather than to zero.
 *
 * The mechanism is deliberately the plainest one the browser offers — a decoded
 * `AudioBuffer` played by an `AudioBufferSourceNode` at rate 1.0, always. No
 * time-stretching, no grains, no overlap-add, no varispeed. The recording is
 * never reconstructed, so it cannot sound reconstructed, and the pitch is the
 * pitch of the record.
 *
 * That leaves exactly one problem, and it is worth stating plainly rather than
 * hiding: a player running at 1.0 advances one second per second, while the
 * mapped target advances at whatever rate the visitor scrolls. The two drift
 * apart. Pitch changes and time-stretching are the usual ways to absorb that,
 * and both are ruled out, so the only tool left is to *seek*. The mapping is
 * therefore chosen (see `HERO_SPAN`) so that ordinary scrolling is already
 * close to 1.0 and seeks are rare; and the tolerance before seeking is loose,
 * because being a second out of position in an ambient passage is imperceptible
 * whereas a seek is not.
 *
 * Scrolling back up drags the target backwards faster than any forward player
 * can follow, so the tolerance is crossed at once and the music jumps back to
 * where the timeline is. That is what "the soundtrack follows the timeline
 * backwards" means for a player that never changes pitch.
 */

/**
 * Where the passage picks the recording up: exactly where the intro put it down.
 *
 * The intro plays this same file from 0 at 1x and pauses it when the film ends,
 * so the position it leaves off at is the film's own length. Measured across
 * four runs the element reads 9.084s at that moment, and since `currentTime`
 * runs about 16ms ahead of what has actually reached the output, the last sample
 * *heard* is near 9.068s — both within 70ms of the nominal, which is far below
 * anything audible as a jump. The nominal is used because it is deterministic
 * and already measured, rather than a number that drifts with scheduling.
 *
 * This is why the passage does not begin at the recording's own start. It would
 * be a different piece of music arriving from nowhere; starting here, it is the
 * same piece continuing. The two seconds of digital silence the file opens with
 * are now simply source metadata — the passage never reaches them.
 */
const INTRO_END = FILM_DURATION;
/**
 * Seconds of recording the whole passage is worth.
 *
 * Chosen so that ordinary scrolling maps to about 1.0: the passage is 420vh of
 * sticky scroll, which at a comfortable 750px/s takes almost exactly this long
 * to cross. Mapping the entire 41.8s track here instead would demand 8x and the
 * player would spend its life seeking, which is heard as ticking.
 */
const HERO_SPAN = 5.2;

/** Movement below this is scroll noise, not motion. */
const PROGRESS_EPS = 1e-4;
/**
 * How far the music may be from its mapped position before it is moved.
 *
 * Generous on purpose. Nobody can tell that an ambient passage is a second
 * further on than it "should" be, but everybody can hear it being cut.
 */
const TOLERANCE = 1.5;
/** Grace before a still timeline stops the music, so wheel notches do not chop it. */
const STILL_GRACE = 0.3;

const SEEK_FADE = 0.02;
const WAKE_FADE = 0.03;
const REST_FADE = 0.08;

export class HeroScore {
  private ctx: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private loading: Promise<void> | null = null;

  private source: AudioBufferSourceNode | null = null;
  private sourceGain: GainNode | null = null;
  /** Where the running source started reading, and when it started. */
  private readFrom = INTRO_END;
  private startedAt = 0;
  private held = INTRO_END;
  private playing = false;

  private lastProgress = -1;
  private movedAt = 0;
  private level = 1;
  private enabled = true;
  private disposed = false;
  private readonly listeners = new Set<() => void>();

  get isOn() {
    return this.enabled;
  }

  /** True once there is a decoded recording to play. */
  get isReady() {
    return Boolean(this.ctx && this.buffer && this.master);
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private announce() {
    for (const fn of this.listeners) fn();
  }

  /**
   * The only input.
   *
   * @param progress the passage's own 0..1, the same value that drives the
   *                 frames, the camera and the beats.
   * @param presence 1 inside the cinematic passage, easing to 0 as it ends.
   */
  setProgress(progress: number, presence: number) {
    if (this.disposed || !this.enabled) return;

    // A window onto the controller that is actually being driven — Strict Mode
    // constructs and throws away a second one, so the constructor is the wrong
    // place to publish it. Dead code in a production build.
    if (process.env.NODE_ENV !== "production") {
      (window as Window & { __heroScore?: unknown }).__heroScore = this;
    }

    const p = clamp01(progress);
    // The very first call is the segment introducing itself, not the visitor
    // moving. Treating it as movement asks for an AudioContext before any
    // gesture has happened, which the autoplay policy refuses.
    if (this.lastProgress < 0) {
      this.lastProgress = p;
      return;
    }
    const moved = Math.abs(p - this.lastProgress) > PROGRESS_EPS;
    this.lastProgress = p;

    if (!this.isReady) {
      // Nothing to play yet. The first movement is what asks for it; the
      // AudioContext is created then, on the activation the entrance already
      // granted, so the intro is not involved in any way.
      if (moved && presence > 0) void this.load();
      return;
    }

    const now = this.ctx!.currentTime;
    if (moved) this.movedAt = now;

    // Past the end of the cinematic passage: the soundtrack belongs to the
    // scene and does not follow the visitor into the reading below it.
    if (presence <= 0) {
      this.setLevel(0);
      this.rest();
      return;
    }
    this.setLevel(presence);

    // A still timeline is a still soundtrack. The grace keeps the gaps between
    // wheel notches from chopping it.
    if (now - this.movedAt > STILL_GRACE) {
      this.rest();
      return;
    }
    if (!moved && !this.playing) return;

    const target = INTRO_END + p * HERO_SPAN;
    if (!this.playing) {
      this.play(target, WAKE_FADE);
      return;
    }
    if (Math.abs(target - this.position()) > TOLERANCE) this.play(target, SEEK_FADE);
  }

  /** Where the recording actually is, right now. */
  private position() {
    if (!this.playing || !this.ctx) return this.held;
    return this.readFrom + (this.ctx.currentTime - this.startedAt);
  }

  /** Starts reading at `from`, crossfading out whatever was running. */
  private play(from: number, fade: number) {
    const ctx = this.ctx;
    const buffer = this.buffer;
    const master = this.master;
    if (!ctx || !buffer || !master) return;

    const at = clamp(from, 0, Math.max(0, buffer.duration - 0.05));
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + fade);
    gain.connect(master);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(now, at);

    this.retire(fade);
    this.source = source;
    this.sourceGain = gain;
    this.readFrom = at;
    this.startedAt = now;
    this.playing = true;
  }

  /** Holds the recording exactly where it is. */
  private rest() {
    if (!this.playing) return;
    this.held = this.position();
    this.retire(REST_FADE);
    this.playing = false;
  }

  /** Fades the running source out and lets it stop itself. */
  private retire(fade: number) {
    const ctx = this.ctx;
    const source = this.source;
    const gain = this.sourceGain;
    this.source = null;
    this.sourceGain = null;
    if (!ctx || !source || !gain) return;

    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fade);
    try {
      source.stop(now + fade + 0.02);
    } catch {
      // Already stopped; `onended` still tidies the nodes away.
    }
  }

  private setLevel(next: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || Math.abs(next - this.level) < 0.01) return;
    this.level = next;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(next, ctx.currentTime + 0.12);
  }

  /**
   * Creates the graph and decodes the recording, once.
   *
   * The context is built here rather than in the entrance, on the user
   * activation that the entrance already granted — so the intro's own
   * soundtrack, timing and implementation are untouched.
   */
  private load(): Promise<void> {
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;

        const ctx = new Ctor();
        await ctx.resume();
        // Refused by the autoplay policy — no gesture has reached this document
        // yet. Close it, clear the latch, and let a later movement try again;
        // leaving `loading` set would disable the soundtrack for the session.
        if (ctx.state !== "running") {
          void ctx.close();
          this.loading = null;
          return;
        }

        const response = await fetch("/intro/score.m4a");
        const bytes = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(bytes);
        if (this.disposed) {
          void ctx.close();
          return;
        }

        const master = ctx.createGain();
        master.gain.value = this.level;
        master.connect(ctx.destination);

        this.ctx = ctx;
        this.buffer = buffer;
        this.master = master;
        this.held = INTRO_END;
        this.announce();
      } catch {
        // Offline, codec refused, or no context. Clear the latch so a later
        // attempt can succeed; the passage is silent until then.
        this.loading = null;
      }
    })();

    return this.loading;
  }

  /** The visitor's own switch. Off stops it; on lets the next movement play it. */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.rest();
    else if (!this.isReady) void this.load();
    this.announce();
  }

  dispose() {
    this.disposed = true;
    this.rest();
    void this.ctx?.close();
    this.ctx = null;
    this.buffer = null;
    this.master = null;
    this.listeners.clear();
  }
}
