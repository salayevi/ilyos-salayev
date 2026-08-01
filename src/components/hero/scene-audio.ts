/**
 * Ambient score for the hero, synthesised in Web Audio.
 *
 * The brief asked for music whose progression stops when scrolling stops. A
 * recorded track cannot do that — pausing a file mid-bar just sounds broken.
 * So the score is generated, and every musical parameter is a function of
 * scroll *position* rather than elapsed time: the chord voicing, the filter
 * opening and the drone octave are all read off the timeline. Stop scrolling
 * and the sound holds exactly where you left it, because there is no clock
 * driving it forward.
 *
 * Scroll *velocity* feeds the wind layer only, so movement has weight.
 *
 * Nothing starts without a gesture — browsers block autoplay, and a portfolio
 * that ambushes you with sound is worse than a silent one.
 */

// A minor pentatonic drift; low enough to read as atmosphere, not melody.
const VOICINGS = [
  [55.0, 82.41, 110.0], // A1 E2 A2
  [55.0, 87.31, 130.81], // A1 F2 C3
  [49.0, 73.42, 110.0], // G1 D2 A2
  [43.65, 65.41, 98.0], // F1 C2 G2
];

export class SceneAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private toneFilter: BiquadFilterNode | null = null;
  private voices: { osc: OscillatorNode; gain: GainNode }[] = [];
  private started = false;

  get isRunning() {
    return this.started && this.ctx?.state === "running";
  }

  /** Must be called from a user gesture. */
  async start() {
    if (this.started) {
      await this.ctx?.resume();
      return;
    }

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // ── drone ─────────────────────────────────────────────────────────────
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = "lowpass";
    toneFilter.frequency.value = 320;
    toneFilter.Q.value = 0.7;
    toneFilter.connect(master);
    this.toneFilter = toneFilter;

    for (let i = 0; i < 3; i += 1) {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = VOICINGS[0][i];
      // A few cents apart so the three voices beat slowly against each other.
      osc.detune.value = (i - 1) * 6;

      const gain = ctx.createGain();
      gain.gain.value = i === 0 ? 0.5 : 0.22;
      osc.connect(gain).connect(toneFilter);
      osc.start();
      this.voices.push({ osc, gain });
    }

    // ── wind ──────────────────────────────────────────────────────────────
    const seconds = 4;
    const noise = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      // Brown-ish noise: closer to air movement than white noise hiss.
      last = (last + Math.random() * 2 - 1) * 0.5;
      data[i] = last;
    }

    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 520;
    windFilter.Q.value = 0.6;

    const windGain = ctx.createGain();
    windGain.gain.value = 0;

    src.connect(windFilter).connect(windGain).connect(master);
    src.start();
    this.windFilter = windFilter;
    this.windGain = windGain;

    this.started = true;
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.4);
  }

  async stop() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.5);
    window.setTimeout(() => void this.ctx?.suspend(), 550);
  }

  /**
   * @param progress 0..1 position on the timeline
   * @param velocity 0..1 normalised absolute scroll speed
   */
  update(progress: number, velocity: number) {
    if (!this.ctx || !this.started || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime;
    const glide = 0.25;

    // Voicing is chosen by position, so the harmony holds when you hold still.
    const slot = Math.min(VOICINGS.length - 1, Math.floor(progress * VOICINGS.length));
    const blend = VOICINGS[slot];
    this.voices.forEach((v, i) => {
      v.osc.frequency.setTargetAtTime(blend[i], t, glide);
    });

    // The scene opens up as you move through it.
    if (this.toneFilter) {
      this.toneFilter.frequency.setTargetAtTime(280 + progress * 900, t, glide);
    }

    if (this.windGain && this.windFilter) {
      this.windGain.gain.setTargetAtTime(0.015 + velocity * 0.16, t, 0.12);
      this.windFilter.frequency.setTargetAtTime(420 + velocity * 900, t, 0.12);
    }
  }

  dispose() {
    this.voices.forEach((v) => {
      try {
        v.osc.stop();
      } catch {
        // Already stopped — nothing to do.
      }
    });
    this.voices = [];
    void this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }
}

/**
 * Continues the exact score unlocked by the entrance scene. The file only
 * advances while the visitor advances the hero, so landing on the page is
 * quiet and stopping the scroll holds the musical position too.
 */
export class ScrollLinkedScore {
  private enabled = true;
  private playing = false;

  constructor(private readonly audio: HTMLAudioElement) {
    this.audio.pause();
    this.audio.volume = 0.42;
  }

  get isRunning() {
    return this.enabled;
  }

  async resume() {
    this.enabled = true;
  }

  pause() {
    this.enabled = false;
    this.playing = false;
    this.audio.pause();
  }

  update(progress: number, velocity: number) {
    if (!this.enabled || progress < 0.012 || velocity < 0.0015 || this.audio.ended) {
      if (this.playing) {
        this.audio.pause();
        this.playing = false;
      }
      return;
    }

    // The track retains its current position; velocity only controls how much
    // life it has. A slow wheel turn is a slow breath, a fast swipe has lift.
    this.audio.playbackRate = Math.min(1.32, Math.max(0.72, 0.72 + velocity * 0.9));
    this.audio.volume = Math.min(0.48, 0.22 + velocity * 0.26);
    if (!this.playing) {
      this.playing = true;
      void this.audio.play().catch(() => {
        this.playing = false;
      });
    }
  }

  dispose() {
    this.audio.pause();
  }
}
