/**
 * The pricing engine.
 *
 * A pure function over a configuration and a set of answers. It touches no
 * database, no clock and no request — which is the whole point: the number a
 * visitor is shown is the number a test can assert, and repricing anything
 * means editing a row rather than editing this file.
 *
 * Order of operations is fixed and deliberate, because it is the part a buyer
 * will eventually ask about:
 *
 *   1. dependencies resolve   — choosing Payments quietly needs a backend
 *   2. conflicts drop         — "no backend" and "user accounts" cannot both hold
 *   3. flat amounts sum       — base price plus every fixed addition
 *   4. the floor applies      — a project cannot be worth less than its minimum
 *   5. multipliers scale      — rush delivery multiplies the work, not the base
 *
 * Multipliers last is what makes the result explainable. Applied earlier they
 * would compound against a partial subtotal and the same selection could price
 * differently depending on the order the questions happened to be answered in.
 */

export type OptionMode = "flat" | "multiplier";

export type PriceOption = {
  groupKey: string;
  key: string;
  label: string;
  /** Shown under the option. Presentation, but it travels with the row. */
  description?: string;
  mode: OptionMode;
  /** Whole currency for `flat`; basis points for `multiplier` (13500 = x1.35). */
  amount: number;
  monthly: number;
  externalMin: number;
  externalMax: number;
  weeks: number;
  /** Basis points scaling the whole span. 10000 leaves it alone. */
  weeksFactor: number;
  requires: string[];
  conflicts: string[];
  needsReview: boolean;
};

export type PriceGroup = {
  key: string;
  label: string;
  help?: string;
  select: "one" | "many";
  required: boolean;
};

export type PriceService = {
  slug: string;
  name: string;
  basePrice: number;
  minimumPrice: number;
  currency: string;
  weeksMin: number;
  weeksMax: number;
};

export type Selections = Record<string, string | string[]>;

export type Line = {
  groupKey: string;
  groupLabel: string;
  optionKey: string;
  label: string;
  mode: OptionMode;
  /** What this line actually added to the one-time total, in whole currency. */
  amount: number;
  /** Present on multipliers so the UI can show "x1.35" beside the money. */
  factor?: number;
  monthly: number;
  /** True when the option was pulled in by a dependency rather than chosen. */
  auto: boolean;
};

export type Estimate = {
  currency: string;
  lines: Line[];
  /** Base price as its own line item — it is never zero and never hidden. */
  base: number;
  oneTime: number;
  monthly: number;
  externalMin: number;
  externalMax: number;
  weeksMin: number;
  weeksMax: number;
  /** True when something selected cannot honestly be priced from a form. */
  isRange: boolean;
  rangeLow: number;
  rangeHigh: number;
  /** Option keys added to satisfy a `requires`, for the UI to explain. */
  autoAdded: string[];
  /** Option keys dropped because they contradicted an earlier choice. */
  dropped: { key: string; because: string }[];
  /** True when the floor lifted the subtotal above what the options summed to. */
  hitMinimum: boolean;
};

/** Money a person reads, not money a machine computed. */
function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

/**
 * A range wide enough to be honest and narrow enough to be useful.
 *
 * Twenty per cent either side is the band within which a scoping call has
 * historically landed. Quoting tighter than that on work nobody has specified
 * yet produces a number the eventual quote has to walk back, which costs more
 * trust than the vagueness saves.
 */
const RANGE_SPREAD = 0.2;

/**
 * How much of the added work actually extends the calendar.
 *
 * Summing every option's weeks treats the project as a queue of one task at a
 * time, which is not how it is built — design proceeds while the schema is
 * being modelled, content lands while features are wired. Adding them straight
 * produced a six-month estimate for a business website, which is both wrong
 * and the kind of wrong that loses the enquiry.
 *
 * Sixty per cent is the share that has historically failed to overlap: setup,
 * review rounds, and the integration work that can only start once two other
 * things are finished.
 */
const PARALLELISM = 0.6;

export function calculate(
  service: PriceService,
  groups: PriceGroup[],
  options: PriceOption[],
  selections: Selections,
): Estimate {
  const byKey = new Map(options.map((o) => [o.key, o]));
  const groupByKey = new Map(groups.map((g) => [g.key, g]));

  // ---- 1. what the visitor actually chose ---------------------------------
  const chosen: string[] = [];
  for (const group of groups) {
    const raw = selections[group.key];
    const keys = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
    for (const key of keys) {
      // Unknown keys are ignored rather than thrown on: a stale saved estimate
      // referencing a since-deleted option should still render, minus that line.
      const option = byKey.get(key);
      if (!option || option.groupKey !== group.key) continue;
      if (group.select === "one" && chosen.some((k) => byKey.get(k)?.groupKey === group.key)) {
        continue;
      }
      if (!chosen.includes(key)) chosen.push(key);
    }
  }

  // ---- 2. dependencies ----------------------------------------------------
  // Fixed point rather than recursion: a requirement may itself require
  // something, and the loop bound makes a malformed cycle in the data a
  // truncated result rather than a stack overflow in production.
  const autoAdded: string[] = [];
  const selected = [...chosen];
  for (let pass = 0; pass < 12; pass++) {
    let grew = false;
    for (const key of [...selected]) {
      for (const need of byKey.get(key)?.requires ?? []) {
        if (selected.includes(need) || !byKey.has(need)) continue;
        selected.push(need);
        autoAdded.push(need);
        grew = true;
      }
    }
    if (!grew) break;
  }

  // ---- 3. conflicts -------------------------------------------------------
  // An explicit choice always beats one that arrived through a dependency, and
  // between two explicit choices the earlier one wins — it is the one the
  // visitor is still looking at.
  const dropped: { key: string; because: string }[] = [];
  const live: string[] = [];
  for (const key of selected) {
    const option = byKey.get(key);
    if (!option) continue;
    const clash = live.find(
      (other) =>
        option.conflicts.includes(other) || (byKey.get(other)?.conflicts ?? []).includes(key),
    );
    if (clash) {
      dropped.push({ key, because: clash });
      continue;
    }
    live.push(key);
  }

  // ---- 4. flats, then the floor, then multipliers --------------------------
  const flatLines: Line[] = [];
  const multiplierOptions: PriceOption[] = [];
  let monthly = 0;
  let externalMin = 0;
  let externalMax = 0;
  let weeks = 0;
  let weeksFactor = 1;
  let needsReview = false;
  let subtotal = service.basePrice;

  for (const key of live) {
    const option = byKey.get(key);
    if (!option) continue;
    const group = groupByKey.get(option.groupKey);

    monthly += option.monthly;
    externalMin += option.externalMin;
    externalMax += option.externalMax;
    weeks += option.weeks;
    if (option.weeksFactor && option.weeksFactor !== 10_000) {
      weeksFactor *= option.weeksFactor / 10_000;
    }
    if (option.needsReview) needsReview = true;

    if (option.mode === "multiplier") {
      multiplierOptions.push(option);
      continue;
    }
    subtotal += option.amount;
    if (option.amount || option.monthly) {
      flatLines.push({
        groupKey: option.groupKey,
        groupLabel: group?.label ?? option.groupKey,
        optionKey: option.key,
        label: option.label,
        mode: "flat",
        amount: option.amount,
        monthly: option.monthly,
        auto: autoAdded.includes(key),
      });
    }
  }

  const hitMinimum = subtotal < service.minimumPrice;
  if (hitMinimum) subtotal = service.minimumPrice;

  const multiplierLines: Line[] = [];
  let total = subtotal;
  for (const option of multiplierOptions) {
    const factor = option.amount / 10_000;
    const delta = Math.round(total * factor - total);
    total += delta;
    if (delta !== 0) {
      multiplierLines.push({
        groupKey: option.groupKey,
        groupLabel: groupByKey.get(option.groupKey)?.label ?? option.groupKey,
        optionKey: option.key,
        label: option.label,
        mode: "multiplier",
        amount: delta,
        factor,
        monthly: 0,
        auto: autoAdded.includes(option.key),
      });
    }
  }

  const oneTime = roundTo(total, 50);

  // The service's own span is the irreducible part; only the added work is
  // discounted for overlap. A rush factor then compresses the whole thing, but
  // never below a week — a calendar cannot be bought down to nothing.
  const added = Math.round(weeks * PARALLELISM);
  const weeksMin = Math.max(1, Math.round((service.weeksMin + added) * weeksFactor));
  const weeksMax = Math.max(weeksMin, Math.round((service.weeksMax + added) * weeksFactor));

  return {
    currency: service.currency,
    base: service.basePrice,
    lines: [...flatLines, ...multiplierLines],
    oneTime,
    monthly,
    externalMin,
    externalMax,
    weeksMin,
    weeksMax,
    isRange: needsReview,
    // Ranges round harder than exact figures. A band reading $8,000–$12,000 is
    // understood as an estimate; one reading $8,150–$11,900 pretends to a
    // precision the review it depends on has not happened yet.
    rangeLow: needsReview ? roundTo(oneTime * (1 - RANGE_SPREAD), 500) : 0,
    rangeHigh: needsReview ? roundTo(oneTime * (1 + RANGE_SPREAD), 500) : 0,
    autoAdded,
    dropped,
    hitMinimum,
  };
}

/**
 * Which options a given selection makes unavailable.
 *
 * The wizard needs this before the visitor clicks, so a contradictory choice
 * can be disabled with a reason attached rather than accepted and silently
 * discarded by `calculate`.
 */
export function blockedBy(options: PriceOption[], selected: string[]): Map<string, string> {
  const byKey = new Map(options.map((o) => [o.key, o]));
  const blocked = new Map<string, string>();
  for (const option of options) {
    for (const key of selected) {
      if (key === option.key) continue;
      const other = byKey.get(key);
      if (!other) continue;
      if (option.conflicts.includes(key) || other.conflicts.includes(option.key)) {
        blocked.set(option.key, other.label);
        break;
      }
    }
  }
  return blocked;
}
