"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

async function send(payload: Record<string, unknown>) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics must never interrupt navigation or the public experience.
  }
}

/**
 * Private, consent-based dashboard analytics. Only coarse device information,
 * deployment-provided city/country and on-site navigation are recorded.
 */
export function VisitorTracker({ consent }: { consent: "granted" | "denied" | null }) {
  const pathname = usePathname();
  // The visitor's answer in this tab overrides the cookie the server read.
  // Deriving beats mirroring: a fresh `consent` prop is picked up for free,
  // and no effect has to re-sync two pieces of state.
  const [choice, setChoice] = useState<boolean | null>(null);
  const allowed = choice ?? consent === "granted";
  const decided = choice !== null || consent !== null;

  useEffect(() => {
    if (!allowed) return;
    void send({ intent: "event", type: "pageview", path: pathname });
  }, [allowed, pathname]);

  useEffect(() => {
    if (!allowed) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (!href.startsWith("/")) return;
      const label = (link.textContent ?? "").trim().replace(/\s+/g, " ");
      void send({ intent: "event", type: "navigation", path: href, label });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [allowed]);

  const decide = async (next: boolean) => {
    await send({ intent: "consent", allowed: next });
    setChoice(next);
  };

  if (decided) return null;
  return (
    <aside
      className="fixed right-4 bottom-4 z-90 max-w-sm rounded-[16px] border border-line-2 bg-s1 p-5 shadow-2xl md:right-6 md:bottom-6"
      aria-label="Tashrif statistikasi roziligi"
    >
      <p className="text-sm font-medium">Tashrif statistikasi</p>
      <p className="mt-2 text-[13px] leading-[1.6] text-ts">
        Saytni yaxshilash uchun faqat sahifalar, qurilma turi va taxminiy hududni yozib olaman.
        IP manzil yoki reklama kuzatuvi saqlanmaydi.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => void decide(true)}
          className="inline-flex h-9 items-center rounded-lg bg-gold px-3.5 text-[13px] font-medium text-void"
        >
          Ruxsat berish
        </button>
        <button
          type="button"
          onClick={() => void decide(false)}
          className="inline-flex h-9 items-center rounded-lg border border-line-2 px-3.5 text-[13px] text-ts"
        >
          Hozir emas
        </button>
      </div>
    </aside>
  );
}
