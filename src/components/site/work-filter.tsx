"use client";

import { useMemo, useState } from "react";

import type { ProjectView } from "@/lib/queries";
import { ProjectTile } from "./project-card";

const FILTERS = ["Barchasi", "SI", "Mahsulot", "Tizim"] as const;

export function WorkFilter({ projects }: { projects: ProjectView[] }) {
  const [active, setActive] = useState<(typeof FILTERS)[number]>("Barchasi");

  const shown = useMemo(
    () => (active === "Barchasi" ? projects : projects.filter((p) => p.category === active)),
    [projects, active],
  );

  return (
    <>
      {/* Horizontal rail on mobile so the filters never wrap into two rows */}
      <div className="mt-8 border-b border-line pb-5 md:mt-14 md:flex md:items-center md:justify-between">
        <div className="rail -mx-5 flex gap-2.5 overflow-x-auto px-5 md:mx-0 md:px-0">
          {FILTERS.map((f) => {
            const on = f === active;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                aria-pressed={on}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors md:rounded md:px-4.5 md:text-sm ${
                  on
                    ? "border-gold bg-gold text-void"
                    : "border-line-2 text-ts hover:border-line-3 hover:text-tp"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <p className="label mt-4 text-[10px] md:mt-0 md:text-xs" aria-live="polite">
          {shown.length} ta loyiha
        </p>
      </div>

      {shown.length > 0 ? (
        <div className="mt-7 grid gap-8 md:mt-11 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {shown.map((p, i) => (
            <ProjectTile key={p.id} project={p} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center md:py-28">
          <div
            aria-hidden
            className="mx-auto flex size-14 items-center justify-center rounded-full border border-line-2 text-2xl text-tt"
          >
            &empty;
          </div>
          <p className="mt-6 text-xl font-medium">Bu filtrda loyiha yo&apos;q</p>
          <p className="mt-2.5 text-[15px] text-ts">
            {active} bo&apos;yicha ochiq keys hozircha tayyorlanmagan.
          </p>
          <button
            type="button"
            onClick={() => setActive("Barchasi")}
            className="mt-6 inline-flex h-11 items-center rounded-lg border border-line-2 px-5 text-sm font-medium transition-colors hover:border-line-3 hover:bg-s2"
          >
            Filtrni tozalash
          </button>
        </div>
      )}
    </>
  );
}
