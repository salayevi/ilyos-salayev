"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `prefers-reduced-motion`, as a subscription rather than a snapshot.
 *
 * The server has no opinion, so it renders the motion-enabled tree and the
 * client corrects on hydration; that ordering matters, because the reduced
 * branches below render static images that would otherwise flash for everyone.
 */
export function useReducedMotion() {
  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
