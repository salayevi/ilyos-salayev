const TONE = {
  open: { dot: "bg-ok", halo: "shadow-[0_0_0_5px_rgb(74_222_128/0.14)]" },
  limited: { dot: "bg-warn", halo: "shadow-[0_0_0_5px_rgb(251_191_36/0.14)]" },
  closed: { dot: "bg-tt", halo: "" },
} as const;

/**
 * The status reads as text as well as colour — colour alone is not an
 * accessible signal, and this badge appears on every page.
 */
export function Availability({
  status,
  label,
  className = "",
}: {
  status: string;
  label: string;
  className?: string;
}) {
  const tone = TONE[status as keyof typeof TONE] ?? TONE.open;
  return (
    <span
      className={`inline-flex h-9 items-center gap-2.5 rounded-full border border-line-2 bg-s2 px-4 text-[13px] text-ts ${className}`}
    >
      <span aria-hidden className={`size-[7px] rounded-full ${tone.dot} ${tone.halo}`} />
      {label}
    </span>
  );
}
