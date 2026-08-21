import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { blockedBy, calculate, type PriceGroup, type PriceOption, type PriceService } from "./engine";

const service: PriceService = {
  slug: "web-app",
  name: "Web ilova",
  basePrice: 2000,
  minimumPrice: 2500,
  currency: "USD",
  weeksMin: 4,
  weeksMax: 6,
};

const groups: PriceGroup[] = [
  { key: "design", label: "Dizayn", select: "one", required: true },
  { key: "features", label: "Funksiyalar", select: "many", required: false },
  { key: "backend", label: "Backend", select: "one", required: true },
  { key: "delivery", label: "Muddat", select: "one", required: false },
];

function option(partial: Partial<PriceOption> & { key: string; groupKey: string }): PriceOption {
  return {
    label: partial.key,
    mode: "flat",
    amount: 0,
    monthly: 0,
    externalMin: 0,
    externalMax: 0,
    weeks: 0,
    weeksFactor: 10_000,
    requires: [],
    conflicts: [],
    needsReview: false,
    ...partial,
  };
}

const options: PriceOption[] = [
  option({ groupKey: "design", key: "design-basic", label: "Bazaviy", amount: 0 }),
  option({ groupKey: "design", key: "design-custom", label: "Custom", amount: 800, weeks: 2 }),
  option({ groupKey: "backend", key: "backend-none", label: "Backendsiz", amount: 0 }),
  option({ groupKey: "backend", key: "backend-crud", label: "Baza + CRUD", amount: 900, weeks: 2 }),
  option({
    groupKey: "features",
    key: "auth",
    label: "Autentifikatsiya",
    amount: 300,
    requires: ["backend-crud"],
    conflicts: ["backend-none"],
  }),
  option({
    groupKey: "features",
    key: "payments",
    label: "To'lov",
    amount: 250,
    monthly: 20,
    externalMin: 15,
    externalMax: 40,
    requires: ["auth"],
  }),
  option({
    groupKey: "features",
    key: "custom-platform",
    label: "Maxsus platforma",
    amount: 1500,
    needsReview: true,
  }),
  option({
    groupKey: "delivery",
    key: "rush",
    label: "Shoshilinch",
    mode: "multiplier",
    amount: 13_500,
    weeksFactor: 6_000,
  }),
];

const run = (selections: Parameters<typeof calculate>[3]) =>
  calculate(service, groups, options, selections);

describe("narx hisoblash", () => {
  it("bo'sh tanlovda minimal narxga tushadi", () => {
    const r = run({});
    // Base is 2000 but the floor is 2500, so the floor is what a buyer sees.
    assert.equal(r.oneTime, 2500);
    assert.equal(r.hitMinimum, true);
    assert.equal(r.lines.length, 0);
  });

  it("qat'iy summalarni bazaga qo'shadi", () => {
    const r = run({ design: "design-custom", backend: "backend-crud" });
    assert.equal(r.oneTime, 2000 + 800 + 900);
    assert.equal(r.hitMinimum, false);
    assert.deepEqual(
      r.lines.map((l) => l.label),
      ["Custom", "Baza + CRUD"],
    );
  });

  it("ko'paytiruvchi qat'iy summalardan KEYIN qo'llanadi", () => {
    const r = run({ design: "design-custom", backend: "backend-crud", delivery: "rush" });
    // 3700 x 1.35 = 4995, rounded to the nearest 50.
    assert.equal(r.oneTime, 5000);
    const rush = r.lines.find((l) => l.optionKey === "rush");
    assert.equal(rush?.mode, "multiplier");
    assert.equal(rush?.factor, 1.35);
    assert.equal(rush?.amount, 1295);
  });

  it("ko'paytiruvchi minimal narxdan keyin ishlaydi, oldin emas", () => {
    // Nothing but rush: the floor lifts 2000 to 2500, then x1.35 = 3375, then
    // the display rounding to the nearest 50 lands it on 3400. Had the
    // multiplier run first the answer would have been 2700 — the floor would
    // have swallowed the rush premium instead of the rush premium applying to
    // the floor, which is the opposite of what the buyer is being charged for.
    const r = run({ delivery: "rush" });
    assert.equal(r.oneTime, 3400);
    assert.equal(r.hitMinimum, true);
  });

  it("bog'liqlikni o'zi qo'shadi", () => {
    const r = run({ features: ["auth"] });
    assert.ok(r.autoAdded.includes("backend-crud"), "backend-crud avtomatik qo'shilishi kerak");
    assert.equal(r.oneTime, 2000 + 300 + 900);
    assert.equal(r.lines.find((l) => l.optionKey === "backend-crud")?.auto, true);
    assert.equal(r.lines.find((l) => l.optionKey === "auth")?.auto, false);
  });

  it("zanjirli bog'liqlikni oxirigacha yechadi", () => {
    // payments -> auth -> backend-crud, none of which were chosen directly.
    const r = run({ features: ["payments"] });
    assert.ok(r.autoAdded.includes("auth"));
    assert.ok(r.autoAdded.includes("backend-crud"));
    assert.equal(r.oneTime, 2000 + 250 + 300 + 900);
  });

  it("zid tanlovni tashlab, sababini aytadi", () => {
    const r = run({ backend: "backend-none", features: ["auth"] });
    const drop = r.dropped.find((d) => d.key === "auth" || d.key === "backend-none");
    assert.ok(drop, "ziddiyat qayd etilishi kerak");
    // Whichever survived, the two are never both live.
    const keys = r.lines.map((l) => l.optionKey);
    assert.ok(!(keys.includes("auth") && keys.includes("backend-none")));
  });

  it("oylik va tashqi xarajatni bir martalik narxdan ajratadi", () => {
    const r = run({ features: ["payments"] });
    assert.equal(r.monthly, 20);
    assert.equal(r.externalMin, 15);
    assert.equal(r.externalMax, 40);
    // The recurring figures must never leak into the development total.
    assert.equal(r.oneTime, 3450);
  });

  it("ko'rib chiqish kerak bo'lsa aniq raqam emas, oraliq beradi", () => {
    const r = run({ features: ["custom-platform"] });
    assert.equal(r.isRange, true);
    assert.ok(r.rangeLow < r.oneTime && r.oneTime < r.rangeHigh);
    // Ranges round to 500 so they read as an estimate, not a computation.
    assert.equal(r.rangeLow % 500, 0);
    assert.equal(r.rangeHigh % 500, 0);
  });

  it("oddiy tanlovda oraliq bermaydi", () => {
    const r = run({ design: "design-custom" });
    assert.equal(r.isRange, false);
    assert.equal(r.rangeLow, 0);
    assert.equal(r.rangeHigh, 0);
  });

  it("bitta tanlanadigan guruhda ikkinchi qiymatni e'tiborsiz qoldiradi", () => {
    const r = run({ design: ["design-basic", "design-custom"] });
    const designLines = r.lines.filter((l) => l.groupKey === "design");
    assert.ok(designLines.length <= 1, "dizayn guruhidan bittadan ortiq qator bo'lmasin");
    assert.equal(r.oneTime, 2500);
  });

  it("noma'lum kalitni e'tiborsiz qoldiradi, xato bermaydi", () => {
    // A saved estimate referencing an option that has since been deleted must
    // still render rather than throwing on someone's screen.
    const r = run({ features: ["yo-q-bunday-narsa"], design: "design-custom" });
    assert.equal(r.oneTime, 2800);
  });

  it("muddatni qo'shadi, lekin ish parallel ketishini hisobga oladi", () => {
    // Design and the schema are built at the same time, so four added weeks of
    // work do not mean four added weeks of calendar: 4 x 0.6 = 2.4 -> 2.
    const r = run({ design: "design-custom", backend: "backend-crud" });
    assert.equal(r.weeksMin, 6);
    assert.equal(r.weeksMax, 8);
  });

  it("shoshilinch yetkazish muddatni qisqartiradi", () => {
    const normal = run({ design: "design-custom", backend: "backend-crud" });
    const rushed = run({ design: "design-custom", backend: "backend-crud", delivery: "rush" });
    // The option's own label promises a shorter calendar. Before `weeksFactor`
    // existed the estimate charged the premium and then quoted the same dates,
    // which a buyer reads as being charged for nothing.
    assert.ok(rushed.weeksMax < normal.weeksMax, "shoshilinch muddat qisqarishi kerak");
    assert.ok(rushed.oneTime > normal.oneTime, "va narx oshishi kerak");
  });

  it("muddat hech qachon bir haftadan past tushmaydi", () => {
    const tiny: PriceService = { ...service, weeksMin: 1, weeksMax: 1 };
    const r = calculate(tiny, groups, options, { delivery: "rush" });
    assert.ok(r.weeksMin >= 1);
    assert.ok(r.weeksMax >= r.weeksMin);
  });

  it("bir xil tanlov har doim bir xil narx beradi", () => {
    const a = run({ design: "design-custom", features: ["auth", "payments"], delivery: "rush" });
    const b = run({ delivery: "rush", features: ["payments", "auth"], design: "design-custom" });
    assert.equal(a.oneTime, b.oneTime);
    assert.equal(a.monthly, b.monthly);
  });
});

describe("bloklangan variantlar", () => {
  it("zid variantni sababi bilan qaytaradi", () => {
    const blocked = blockedBy(options, ["backend-none"]);
    assert.equal(blocked.get("auth"), "Backendsiz");
  });

  it("hech narsa tanlanmaganda hech narsa bloklamaydi", () => {
    assert.equal(blockedBy(options, []).size, 0);
  });
});
