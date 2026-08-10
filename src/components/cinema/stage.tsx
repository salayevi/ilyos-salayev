"use client";

import { useStage } from "./use-cinema";

/**
 * A chapter mark on the page.
 *
 * Each anchor opens a stage that runs to the next one, and each stage owns a
 * fixed slice of the score (see `lib/cinema/score.ts`). A flat
 * `scrollY / maxScroll` mapping would spend most of the soundtrack on the
 * hero, because the hero is 520vh of deliberately slow footage while the
 * sections below it are ordinary reading length. Declaring the chapters lets
 * the edit decide how much music each part of the page is worth, while keeping
 * the mapping continuous across the joins.
 *
 * It renders an empty, zero-height div so it can be dropped between sections
 * without disturbing a single thing about the layout — no wrapper, no extra
 * box for margins to collapse against, nothing for the eye.
 */
export function StageAnchor({ name }: { name: string }) {
  const ref = useStage(name);
  return <div ref={ref} data-stage={name} aria-hidden />;
}
