/**
 * DOG · WOLF · DRAGON — the three depths of collaboration.
 *
 * These are not subscription tiers. They describe how far into a project I go,
 * and they share one content contract on purpose: every tier answers the same
 * six questions in the same order, so a buyer comparing them is comparing
 * scope, not marketing.
 *
 * The shape lives in code rather than in the database because it is brand
 * structure, not routine content — adding a fourth tier is a design decision,
 * not an evening's data entry. The two starting prices are the exception: they
 * move with the market, so they come from `settings` and are editable from the
 * panel without a deploy.
 */

export type Tier = "dog" | "wolf" | "dragon";

export type Plan = {
  tier: Tier;
  name: string;
  positioning: string;
  /** Who the tier is actually for — the first thing a buyer scans for. */
  bestFor: string[];
  price: string;
  priceNote: string;
  deliverables: string[];
  timeline: string;
  revisions: string;
  support: string;
  ctaLabel: string;
};

/** Whole USD. Overridden from settings; these are the values shipped in code. */
export const DEFAULT_DOG_PRICE = 500;
export const DEFAULT_WOLF_PRICE = 1500;

function usd(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

export function buildPlans(dogPrice: number, wolfPrice: number): Plan[] {
  return [
    {
      tier: "dog",
      name: "DOG",
      positioning: "Essential Digital Launch",
      bestFor: ["Landing", "Portfolio", "Kichik biznes"],
      price: `${usd(dogPrice)} dan`,
      priceNote: "Aniq narx hajmga qarab belgilanadi",
      deliverables: [
        "Responsive interfeys",
        "Asosiy development",
        "Bazaviy UI/UX",
        "Aloqa formasi",
        "SEO poydevori",
        "Domen va deploy",
      ],
      timeline: "1–2 hafta",
      revisions: "2 marta",
      support: "1 oy",
      ctaLabel: "Dog bilan boshlash",
    },
    {
      tier: "wolf",
      name: "WOLF",
      positioning: "Professional Custom Build",
      bestFor: ["Biznes", "Brend", "Ko'p sahifali"],
      price: `${usd(wolfPrice)} dan`,
      priceNote: "Aniq narx hajmga qarab belgilanadi",
      deliverables: [
        "Custom UX arxitektura",
        "Custom vizual dizayn",
        "Kengaytirilgan responsive",
        "Animatsiya va o'tishlar",
        "Kontent boshqaruvi",
        "Tashqi integratsiyalar",
        "Analitika",
        "Tezlik optimizatsiyasi",
      ],
      timeline: "3–6 hafta",
      revisions: "Kengaytirilgan",
      support: "3 oy",
      ctaLabel: "Wolf bilan boshlash",
    },
    {
      tier: "dragon",
      name: "DRAGON",
      positioning: "Signature Digital Product",
      bestFor: ["SaaS", "AI tizim", "Premium brend", "Web app"],
      // Deliberately not a number. A bespoke system priced from a card would be
      // a guess, and a guess a buyer later has to be talked out of.
      price: "Individual baho",
      priceNote: "Hajm suhbatdan keyin aniqlanadi",
      deliverables: [
        "Mahsulot strategiyasi",
        "UX arxitektura",
        "Custom vizual yo'nalish",
        "Frontend va backend",
        "Baza va API",
        "Admin tizimi",
        "AI va avtomatlashtirish",
        "Custom motion",
        "Deploy arxitekturasi",
        "QA va ishga tushirish",
      ],
      timeline: "8–16 hafta",
      revisions: "Loyiha bo'ylab",
      support: "6 oy va undan ortiq",
      ctaLabel: "Dragon loyihasini boshlash",
    },
  ];
}

export type Level = "yes" | "optional" | "custom" | "no";

/**
 * The comparison matrix. Four levels rather than a tick/cross pair, because
 * "kelishuv bo'yicha" is the honest answer for most of the middle tier and
 * flattening it to a cross would undersell Wolf.
 */
export const PLAN_FEATURES: { label: string; levels: [Level, Level, Level] }[] = [
  { label: "Strategiya", levels: ["no", "optional", "yes"] },
  { label: "Custom UI/UX", levels: ["no", "yes", "yes"] },
  { label: "Responsive", levels: ["yes", "yes", "yes"] },
  { label: "Frontend", levels: ["yes", "yes", "yes"] },
  { label: "Backend", levels: ["no", "optional", "yes"] },
  { label: "Ma'lumotlar bazasi", levels: ["no", "optional", "yes"] },
  { label: "Kontent boshqaruvi", levels: ["no", "optional", "yes"] },
  { label: "Kengaytirilgan motion", levels: ["no", "optional", "yes"] },
  { label: "SEO", levels: ["yes", "yes", "yes"] },
  { label: "Analitika", levels: ["no", "yes", "yes"] },
  { label: "API", levels: ["no", "optional", "yes"] },
  { label: "Sun'iy intellekt", levels: ["no", "optional", "yes"] },
  { label: "Avtomatlashtirish", levels: ["no", "optional", "yes"] },
  { label: "Admin panel", levels: ["no", "optional", "custom"] },
  { label: "Mobil ilova", levels: ["no", "no", "custom"] },
  { label: "Deploy", levels: ["yes", "yes", "yes"] },
  { label: "Qo'llab-quvvatlash", levels: ["optional", "yes", "yes"] },
  { label: "Ustuvor navbat", levels: ["no", "no", "yes"] },
];

/**
 * One glyph per level, and a word for every glyph.
 *
 * The site ships no icon set, so these are Unicode marks — which means they
 * carry no meaning to a screen reader on their own. `label` is what gets read
 * out; the glyph is `aria-hidden` decoration beside it.
 */
export const LEVEL_MARK: Record<Level, { glyph: string; label: string }> = {
  yes: { glyph: "●", label: "Kiradi" },
  optional: { glyph: "○", label: "Kelishuv bo'yicha" },
  custom: { glyph: "◆", label: "Individual" },
  no: { glyph: "–", label: "Kirmaydi" },
};
