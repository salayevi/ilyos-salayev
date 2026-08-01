import Link from "next/link";

import type { ProjectView } from "@/lib/queries";
import { MediaFrame, hostOf, toneOf } from "./media-frame";

/**
 * On hover the media scales inside a fixed frame while the card itself stays
 * put — it should read as a camera pushing in, not a box inflating.
 */
export function ProjectCard({
  project,
  size = "standard",
  priority = false,
}: {
  project: ProjectView;
  size?: "standard" | "feature";
  priority?: boolean;
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
          src={project.previewImage || undefined}
          alt={`${project.title} sayti ekrani`}
          priority={priority}
          sizes={feature ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
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
export function ProjectTile({
  project,
  priority = false,
}: {
  project: ProjectView;
  /** Set on the first row: one of those screenshots is the page's LCP. */
  priority?: boolean;
}) {
  const host = hostOf(project.liveUrl);

  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div className="overflow-hidden rounded-[16px] border border-line transition-colors group-hover:border-line-3">
        {/* The screenshot is the point of this tile, so it gets a browser bar
            and no scrim — nothing is overlaid on it that needs legibility. */}
        <div className="flex h-8 items-center gap-2 border-b border-line bg-s2 px-3">
          <span aria-hidden className="flex gap-1.5">
            <i className="block size-2 rounded-full bg-line-3" />
            <i className="block size-2 rounded-full bg-line-3" />
            <i className="block size-2 rounded-full bg-line-3" />
          </span>
          {host && (
            <span className="truncate font-mono text-[10px] text-tt">{host}</span>
          )}
        </div>
        <MediaFrame
          tone={toneOf(project.tone)}
          src={project.previewImage || undefined}
          alt={`${project.title} sayti ekrani`}
          rounded={false}
          scrim={!project.previewImage}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-[220px] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] md:h-[300px]"
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
