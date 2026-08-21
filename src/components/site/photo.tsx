import Image from "next/image";

/**
 * The real photographs, graded into the site's palette.
 *
 * The frames were shot warm — daylight, stone, linen — while the rest of the
 * site is near-black. Dropping them in untreated makes the page look like two
 * different websites, so each one carries a veil and a faint duotone wash, kept light
 * enough that skin never reads as tinted. The
 * grade is an overlay rather than baked into the file: the originals stay
 * printable, and one edit here re-grades every photograph on the site.
 */

const WASH = {
  none: "",
  warm: "rgb(176 29 54 / 0.09)",
  cold: "rgb(90 78 82 / 0.16)",
} as const;

export type PhotoWash = keyof typeof WASH;

export function Photo({
  src,
  alt,
  width,
  height,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  wash = "warm",
  veil = true,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  wash?: PhotoWash;
  veil?: boolean;
  priority?: boolean;
}) {
  return (
    <figure className={`relative overflow-hidden bg-s1 ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className="size-full object-cover"
      />

      {wash !== "none" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-color"
          style={{ background: WASH[wash] }}
        />
      )}

      {/* Sinks the bottom edge into the page so the crop never reads as a cut. */}
      {veil && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
          style={{ background: "linear-gradient(180deg, transparent, rgb(5 2 3 / 0.72))" }}
        />
      )}
    </figure>
  );
}
