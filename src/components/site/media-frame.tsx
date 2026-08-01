import Image from "next/image";

const TONES = {
  gold: "radial-gradient(70% 55% at 28% 22%, rgb(200 169 106 / 0.20), transparent 62%)",
  azure: "radial-gradient(70% 55% at 72% 26%, rgb(74 143 231 / 0.24), transparent 62%)",
  green: "radial-gradient(70% 60% at 45% 30%, rgb(74 222 128 / 0.15), transparent 60%)",
  violet: "radial-gradient(70% 60% at 60% 25%, rgb(160 120 220 / 0.18), transparent 60%)",
} as const;

export type Tone = keyof typeof TONES;

export function toneOf(value: string): Tone {
  return value in TONES ? (value as Tone) : "gold";
}

/**
 * Every image on the site sits inside this frame, so the duotone, veil and
 * radius are a single component edit rather than sixty manual ones.
 *
 * With a `src` it shows the captured screenshot; without one it falls back to
 * the lighting treatment alone, so a project whose shot has not been taken yet
 * still renders as a finished card rather than a broken image.
 *
 * Screenshots are anchored to the top (`object-top`): a site's identity is in
 * its header and first fold, and centre-cropping a 1280×800 capture into a card
 * throws exactly that away.
 */
export function MediaFrame({
  tone = "gold",
  className = "",
  rounded = true,
  src,
  alt = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  scrim = true,
  children,
}: {
  tone?: Tone;
  className?: string;
  rounded?: boolean;
  src?: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  /** The dark wash that keeps overlaid type legible. Off for bare screenshots. */
  scrim?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden ${rounded ? "rounded-[16px]" : ""} ${className}`}
      style={{ background: "linear-gradient(155deg, #1A2029, #0C1014 62%, #070A0D)" }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top"
        />
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: TONES[tone] }} />
      )}
      {scrim && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: src
              ? "linear-gradient(180deg, rgb(5 6 7 / 0.1) 0%, transparent 30%, rgb(5 6 7 / 0.88))"
              : "linear-gradient(180deg, transparent 42%, rgb(5 6 7 / 0.94))",
          }}
        />
      )}
      {children}
    </div>
  );
}

/**
 * A screenshot presented as a browser window.
 *
 * Case-study and listing pages promise "this is the real site" — a bare
 * rectangle reads as stock art, whereas a title bar and an address make the
 * same pixels read as a screen capture of something that exists.
 */
export function BrowserFrame({
  src,
  alt,
  url,
  className = "",
  priority = false,
  sizes = "100vw",
}: {
  src?: string;
  alt: string;
  url?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const host = hostOf(url);

  return (
    <figure className={`overflow-hidden rounded-[16px] border border-line bg-s1 ${className}`}>
      <div className="flex h-9 items-center gap-2 border-b border-line bg-s2 px-3.5 md:h-11 md:px-4">
        <span aria-hidden className="flex gap-1.5">
          <i className="block size-2.5 rounded-full bg-line-3" />
          <i className="block size-2.5 rounded-full bg-line-3" />
          <i className="block size-2.5 rounded-full bg-line-3" />
        </span>
        {host && (
          <span className="truncate rounded bg-void/60 px-2.5 py-1 font-mono text-[10px] text-tt md:text-[11px]">
            {host}
          </span>
        )}
      </div>
      <div className="relative aspect-[16/10] w-full bg-base">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="label text-[10px]">Screenshot hali olinmagan</p>
          </div>
        )}
      </div>
    </figure>
  );
}

export function hostOf(raw?: string): string {
  if (!raw) return "";
  try {
    return new URL(raw).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

