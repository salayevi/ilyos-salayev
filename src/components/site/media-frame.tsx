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
 * Until real photography lands it renders the lighting treatment alone.
 */
export function MediaFrame({
  tone = "gold",
  className = "",
  rounded = true,
  children,
}: {
  tone?: Tone;
  className?: string;
  rounded?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden ${rounded ? "rounded-[16px]" : ""} ${className}`}
      style={{ background: "linear-gradient(155deg, #1A2029, #0C1014 62%, #070A0D)" }}
    >
      <div aria-hidden className="absolute inset-0" style={{ background: TONES[tone] }} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 42%, rgb(5 6 7 / 0.94))" }}
      />
      {children}
    </div>
  );
}

/**
 * Placeholder portrait: a lit figure in fog. Swap for a real <Image> once the
 * shot is graded — the surrounding layout does not change.
 */
export function Portrait({ className = "", cold = false }: { className?: string; cold?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: [
          "radial-gradient(120% 80% at 50% 6%, rgb(230 240 255 / 0.34), rgb(10 12 15 / 0) 58%)",
          cold
            ? "radial-gradient(90% 70% at 50% 62%, rgb(74 143 231 / 0.20), rgb(5 6 7 / 0) 62%)"
            : "radial-gradient(90% 70% at 50% 62%, rgb(200 169 106 / 0.20), rgb(5 6 7 / 0) 62%)",
          "linear-gradient(180deg, #12161C 0%, #0A0D11 55%, #050607 100%)",
        ].join(","),
      }}
    >
      <div
        aria-hidden
        className="absolute left-1/2 bottom-0 h-[62%] w-[46%] -translate-x-1/2"
        style={{
          background: "linear-gradient(180deg, rgb(120 132 148 / 0.42), rgb(18 22 28 / 0.9) 62%)",
          borderRadius: "46% 46% 6px 6px / 34% 34% 4px 4px",
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 bottom-[52%] w-[19%] -translate-x-1/2 pt-[23%]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 38%, rgb(214 165 130 / 0.85), rgb(60 48 42 / 0.5) 70%)",
          borderRadius: "50% 50% 44% 44%",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 55%, #050607 97%)" }}
      />
    </div>
  );
}
