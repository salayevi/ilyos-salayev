import Link from "next/link";

import type { ProjectView } from "@/lib/queries";
import { MediaFrame, toneOf } from "./media-frame";

/**
 * On hover the media scales inside a fixed frame while the card itself stays
 * put — it should read as a camera pushing in, not a box inflating.
 */
export function ProjectCard({
  project,
  size = "standard",
}: {
  project: ProjectView;
  size?: "standard" | "feature";
}) {
  const feature = size === "feature";

  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block rounded-[16px] focus-visible:outline-offset-4"
    >
      <div className="relative overflow-hidden rounded-[16px] border border-transparent transition-colors duration-500 group-hover:border-gold/40">
        <MediaFrame
          tone={toneOf(project.tone)}
          className={`transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${
            feature ? "h-[280px] md:h-[560px]" : "h-[250px] md:h-[440px]"
          }`}
        />
        <div className="pointer-events-none absolute inset-x-5 bottom-5 z-10 md:inset-x-10 md:bottom-9">
          {feature && <p className="label mb-3.5 text-[11px] md:text-xs">Asosiy loyiha</p>}
          <h3
            className={`font-medium tracking-[-0.01em] ${
              feature ? "text-[28px] md:text-5xl" : "text-[22px] md:text-[34px]"
            }`}
          >
            {project.title}
          </h3>
          {feature && (
            <p className="mt-3 max-w-[620px] text-[15px] text-ts md:text-[17px]">{project.summary}</p>
          )}
          <div className="mt-3.5 flex flex-wrap gap-2">
            {project.stack.slice(0, feature ? 3 : 2).map((t) => (
              <span
                key={t}
                className="rounded border border-line-2 bg-s1/60 px-2.5 py-1 text-[11px] text-ts md:text-xs"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Compact row used on the work index and inside filters. */
export function ProjectTile({ project }: { project: ProjectView }) {
  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div className="overflow-hidden rounded-[16px]">
        <MediaFrame
          tone={toneOf(project.tone)}
          className="h-[250px] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] md:h-[330px]"
        />
      </div>
      <h3 className="mt-4 text-[22px] font-medium transition-colors group-hover:text-gold md:mt-5 md:text-2xl">
        {project.title}
      </h3>
      <p className="mt-1.5 flex items-baseline justify-between gap-3 text-sm text-tt">
        <span>{project.summary}</span>
        <span className="shrink-0 font-mono">{project.year}</span>
      </p>
    </Link>
  );
}
