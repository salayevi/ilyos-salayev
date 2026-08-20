import Image from "next/image";
import Link from "next/link";

import type { Plan } from "@/lib/plans";

/**
 * One service-plan card.
 *
 * The three tiers are separated by visual *weight*, never by hue — the palette
 * allows one chromatic accent, so a green Dog beside a red Dragon would break
 * the identity before it communicated anything. Dog is the quietest panel,
 * Wolf gains a crimson border and the recommended badge, Dragon gets the
 * metallic rim, an inner reflection and the S-curve lifted off the dragon tail.
 *
 * Explicitly not here: flames, neon, glow, or gaming chrome. The tier has to
 * read as a level of service to someone about to spend real money.
 */
const TIER = {
  dog: {
    frame: "bg-s1 border-line-2 hover:border-line-3",
    pad: "p-7 md:p-8",
    name: "text-[34px] md:text-[38px]",
    positioning: "text-tt",
    price: "text-accent-text",
    bullet: "text-tm",
    cta: "border border-line-3 text-tp hover:bg-s2",
  },
  wolf: {
    frame:
      "bg-linear-168 from-s2 to-s1 border-line-3 hover:border-line-accent shadow-[0_18px_50px_-24px_rgb(0_0_0/0.9)]",
    pad: "p-7 md:p-9",
    name: "text-[40px] md:text-[44px]",
    positioning: "text-tt",
    price: "text-accent-text",
    bullet: "text-tm",
    cta: "border border-line-accent text-tp hover:bg-crimson-900",
  },
  dragon: {
    frame:
      "border-line-accent bg-linear-168 from-[#150c0f] via-[#0a0506] to-[#120a0d] shadow-[0_0_0_1px_rgb(176_29_54/0.10),0_24px_70px_-30px_rgb(176_29_54/0.45)] hover:border-crimson-300",
    pad: "p-7 md:p-10",
    name: "text-[44px] md:text-[52px]",
    positioning: "text-accent-text",
    price: "text-tp",
    bullet: "text-accent-text",
    cta: "bg-accent text-tp hover:bg-accent-hover",
  },
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5">
      <dt className="text-[13px] text-tt">{label}</dt>
      <dd className="text-right text-[13px] text-ts">{value}</dd>
    </div>
  );
}

export function PlanCard({ plan }: { plan: Plan }) {
  const t = TIER[plan.tier];
  const isDragon = plan.tier === "dragon";

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-[24px] border transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${t.frame} ${t.pad}`}
    >
      {isDragon && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgb(176_29_54/0.18),transparent_60%)]"
          />
          {/* The dragon tail, abstracted to a single arc. Subtle enough that it
              reads as craft rather than as an illustration. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-[20%] -right-[30%] h-[140%] w-[90%] rotate-[18deg] rounded-full border border-[rgb(214_58_80/0.14)]"
          />
          <Image
            src="/brand/logo-512.png"
            alt=""
            aria-hidden
            width={512}
            height={512}
            className="pointer-events-none absolute -right-10 -bottom-8 w-[260px] opacity-[0.07]"
          />
        </>
      )}

      {plan.tier === "wolf" && (
        <span className="label absolute top-5 right-5 rounded-full border border-line-accent bg-[rgb(176_29_54/0.12)] px-3 py-1.5 text-[9px] tracking-[0.12em] text-accent-text">
          Eng ko&apos;p tanlanadi
        </span>
      )}

      <div className="relative">
        <h3 className={`font-display leading-none tracking-[-0.02em] ${t.name}`}>{plan.name}</h3>
        <p className={`label mt-2.5 text-[10px] tracking-[0.1em] ${t.positioning}`}>
          {plan.positioning}
        </p>

        <div className="mt-6 border-t border-line pt-5">
          <p className={`font-display text-[32px] leading-none ${t.price}`}>{plan.price}</p>
          <p className="mt-1.5 text-xs text-tt">{plan.priceNote}</p>
        </div>

        <div className="mt-6">
          <p className="label text-[10px]">Kimga mos</p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {plan.bestFor.map((b) => (
              <li
                key={b}
                className="rounded border border-line-2 px-2.5 py-1 font-mono text-[10px] text-tt"
              >
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <p className="label text-[10px]">Nima kiradi</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {plan.deliverables.map((d) => (
              <li key={d} className="flex gap-2.5 text-sm leading-[1.5] text-ts">
                <span aria-hidden className={`shrink-0 ${t.bullet}`}>
                  —
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-6">
          <Row label="Taxminiy muddat" value={plan.timeline} />
          <Row label="Tahrirlar" value={plan.revisions} />
          <Row label="Qo'llab-quvvatlash" value={plan.support} />
        </dl>
      </div>

      <div className="relative mt-auto pt-7">
        {/*
          The tier travels to the contact page as a query parameter, so the
          brief arrives already knowing which conversation this is — the buyer
          does not have to restate the choice they just made.
        */}
        <Link
          href={`/contact?tarif=${plan.tier}`}
          className={`flex h-12 w-full items-center justify-center rounded-lg text-[15px] font-medium transition-colors ${t.cta}`}
        >
          {plan.ctaLabel}
        </Link>
      </div>
    </article>
  );
}
