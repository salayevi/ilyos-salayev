import type { Selections } from "./engine";

/**
 * Dog, Wolf and Dragon — kept as a way in, not as a price list.
 *
 * They used to be three cards with three figures, which is what made the site
 * contradict itself: the same build was quoted one way here and another way on
 * the services page. As presets they still carry the brand and still say
 * something true about depth of engagement, but the number now comes from the
 * same engine as everything else. Choosing one fills the wizard; changing
 * anything afterwards simply reprices.
 *
 * A preset names options across every group. A service that does not use a
 * given group never sees those keys — `calculate` only reads the groups it was
 * handed — so one definition covers the whole catalogue without a per-service
 * table of exceptions.
 */
export type Preset = {
  tier: "dog" | "wolf" | "dragon";
  name: string;
  positioning: string;
  blurb: string;
  selections: Selections;
};

export const PRESETS: Preset[] = [
  {
    tier: "dog",
    name: "DOG",
    positioning: "Essential",
    blurb: "Kerakli narsa, ortiqchasiz. Tez ishga tushadi.",
    selections: {
      size: "size-1",
      design: "design-basic",
      features: ["f-contact"],
      backend: "be-none",
      integrations: [],
      content: "c-client",
      animation: "a-none",
      delivery: "d-normal",
      care: "care-basic",
    },
  },
  {
    tier: "wolf",
    name: "WOLF",
    positioning: "Professional",
    blurb: "O'ziga xos dizayn, backend va integratsiyalar bilan.",
    selections: {
      size: "size-10",
      design: "design-custom",
      features: ["f-contact", "f-search", "f-admin"],
      backend: "be-crud",
      integrations: ["i-telegram", "i-email"],
      content: "c-format",
      animation: "a-micro",
      delivery: "d-normal",
      care: "care-pro",
    },
  },
  {
    tier: "dragon",
    name: "DRAGON",
    positioning: "Flagship",
    blurb: "To'liq tizim — rollar, avtomatlashtirish, kinematik interfeys.",
    selections: {
      size: "size-20",
      design: "design-premium",
      features: ["f-contact", "f-auth", "f-admin", "f-roles", "f-notify", "f-analytics"],
      backend: "be-auth",
      integrations: ["i-telegram", "i-email", "i-ai"],
      content: "c-full",
      animation: "a-cinematic",
      delivery: "d-priority",
      care: "care-business",
    },
  },
];

/**
 * Whether the current selection still matches a preset exactly.
 *
 * Used to keep a preset highlighted only while it is actually describing what
 * is on screen. Leaving it lit after the visitor has changed something would
 * misreport the configuration they are about to be quoted for.
 */
export function matchingPreset(selections: Selections, groupKeys: string[]): Preset | null {
  const same = (a: string | string[] | undefined, b: string | string[] | undefined) => {
    const left = a === undefined ? [] : Array.isArray(a) ? [...a].sort() : [a];
    const right = b === undefined ? [] : Array.isArray(b) ? [...b].sort() : [b];
    return left.length === right.length && left.every((v, i) => v === right[i]);
  };
  return (
    PRESETS.find((preset) =>
      groupKeys.every((key) => same(selections[key], preset.selections[key])),
    ) ?? null
  );
}
