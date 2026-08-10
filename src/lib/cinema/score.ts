/**
 * The master timeline is measured in seconds of the soundtrack.
 *
 * That is the whole trick behind the synchronisation: there is no separate
 * "animation progress" to keep in step with the music, because the music *is*
 * the coordinate system. Ask the timeline where it is and the answer is
 * already the tape position.
 *
 * The numbers below are the real durations of the files in `public/intro`,
 * measured with ffprobe. If either asset is replaced, re-measure and update
 * here — this file is the single place the edit is defined.
 */

/** `public/intro/score.m4a` */
export const SCORE_DURATION = 41.82;
/** `public/intro/loading.mp4` — both tiers are the same length. */
export const FILM_DURATION = 9.134;

export type ActName = "invocation" | "passage" | "interior" | "resolve";

export type Act = { readonly from: number; readonly to: number };

/**
 * Four acts, continuous and gapless: each one begins exactly where the last
 * ended, so the playhead never has a value that belongs to nothing.
 *
 * `invocation` is driven by the film's own clock — it has an edit of its own
 * and scrubbing an mp4 is unreliable on iOS. Everything after it is driven by
 * scroll position. Both drive the *same* playhead, which is why the handover
 * is a change of input rather than a handoff between systems.
 */
export const ACTS: Record<ActName, Act> = {
  invocation: { from: 0, to: FILM_DURATION },
  passage: { from: FILM_DURATION, to: 26 },
  interior: { from: 26, to: 38 },
  resolve: { from: 38, to: SCORE_DURATION },
};

/** Where scroll takes over from the film. */
export const SCRUB_FROM = ACTS.passage.from;

/* ============================================================================
   Where the soundtrack sits on the timeline.
   ==========================================================================*/

/**
 * The soundtrack belongs to the cinematic scenes and to nothing else.
 *
 * It runs under the film and under the passage through the door, then fades
 * out and stops. `interior` and `resolve` are reading, not cinema; a score
 * still playing over a list of case studies is a score that has outstayed its
 * scene.
 */
export const CINEMA_ENDS_AT = ACTS.passage.to;

/** Master-time window over which the score recedes as the passage closes. */
export const SCORE_FADE = 2.4;

/**
 * Seconds of score the passage is worth — and the fix for music that raced.
 *
 * The timeline is measured in score seconds, but the *rate* the visitor moves
 * through it is set by scroll, not by the clock. The passage covers 16.87s of
 * timeline across 420vh of sticky scrub, which is 4.46ms of score per pixel:
 * at an ordinary 750px/s that plays the music at 3.3×, permanently, and a
 * flick sends it past 15×. No amount of smoothing rescues that — the mapping
 * itself was wrong.
 *
 * Two independent ways of choosing the right number agree. Matching the
 * picture: 134 frames is 4.5–5.6s of footage depending on its capture rate.
 * Matching the hand: at 750px/s the passage takes about 5s to walk through, so
 * 5s of score is 1×. Both land here.
 *
 * The timeline is untouched — this only changes how much *tape* that stretch
 * of timeline pulls, so every animation still runs exactly as before.
 */
export const PASSAGE_SCORE_SPAN = 5.2;

/**
 * Master playhead → position in the score file.
 *
 * The film is 1:1: it has its own clock and the score runs beside it. The
 * passage is compressed onto `PASSAGE_SCORE_SPAN`, which is what makes the
 * music travel at the same apparent speed as the picture.
 */
export function scoreTimeFor(masterTime: number): number {
  if (masterTime <= FILM_DURATION) return Math.max(0, masterTime);
  const through = (masterTime - FILM_DURATION) / (CINEMA_ENDS_AT - FILM_DURATION);
  return FILM_DURATION + Math.min(1, Math.max(0, through)) * PASSAGE_SCORE_SPAN;
}

/**
 * How present the score should be at `masterTime`: 1 through the cinematic
 * scenes, easing to 0 as the passage ends, and 0 for the rest of the page.
 *
 * Reversible like everything else on the timeline — scrolling back up into the
 * passage brings the score back with it, at the position it was left at.
 */
export function cinemaGain(masterTime: number): number {
  if (masterTime >= CINEMA_ENDS_AT) return 0;
  const from = CINEMA_ENDS_AT - SCORE_FADE;
  if (masterTime <= from) return 1;
  const left = (CINEMA_ENDS_AT - masterTime) / SCORE_FADE;
  // Smoothstep rather than linear: a straight amplitude ramp reads as a cut in
  // the last half-second, because loudness is not linear in amplitude.
  return left * left * (3 - 2 * left);
}

/** Stage names are the contract between `page.tsx` markup and the scroll map. */
export const STAGE_ACTS: Record<string, Act> = {
  passage: ACTS.passage,
  interior: ACTS.interior,
  resolve: ACTS.resolve,
};

export type StageName = keyof typeof STAGE_ACTS;

/** Document order. The scroll map relies on this to build monotonic breakpoints. */
export const STAGE_ORDER: readonly string[] = ["passage", "interior", "resolve"];
