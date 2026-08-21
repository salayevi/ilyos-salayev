import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatMoney, formatMoneyExact } from "./format";

const NBSP = " ";

describe("pul formati", () => {
  it("mingliklarni bo'linmas probel bilan ajratadi", () => {
    assert.equal(formatMoneyExact(4500, "USD"), `$4${NBSP}500`);
    assert.equal(formatMoneyExact(24350, "USD"), `$24${NBSP}350`);
    assert.equal(formatMoneyExact(1234567, "USD"), `$1${NBSP}234${NBSP}567`);
  });

  it("uch xonagacha bo'lgan sonni ajratmaydi", () => {
    assert.equal(formatMoneyExact(500, "USD"), "$500");
    assert.equal(formatMoneyExact(0, "USD"), "$0");
  });

  it("dollardan boshqa valyutani orqasiga qo'yadi", () => {
    assert.equal(formatMoneyExact(1200, "EUR"), `1${NBSP}200 EUR`);
    assert.equal(formatMoneyExact(15000000, "UZS"), `15${NBSP}000${NBSP}000 UZS`);
  });

  it("nol formatMoney uchun 'raqam yo'q' degani", () => {
    // The panel leaves the field at 0 for anything quoted per project, and a
    // literal "$0" beside a service would read as free rather than as unpriced.
    assert.equal(formatMoney(0, "USD"), null);
    assert.equal(formatMoney(500, "USD"), "$500");
  });

  it("natija Intl locale ma'lumotiga bog'liq emas", () => {
    // The whole reason this is hand-rolled: Node returns "4 500" from
    // toLocaleString("uz-UZ") and the browsers this site is opened in return
    // "4,500". The calculator renders on both sides from the same numbers, so
    // any divergence here is a hydration mismatch the user watches happen.
    const output = formatMoneyExact(4500, "USD");
    assert.ok(!output.includes(","), "vergul bo'lmasin — brauzer ICU'siga bog'liq bo'lib qoladi");
    assert.ok(output.includes(NBSP), "ajratgich aniq bo'linmas probel bo'lsin");
  });

  it("manfiy sonni ham to'g'ri ko'rsatadi", () => {
    assert.equal(formatMoneyExact(-1500, "USD"), `$-1${NBSP}500`);
  });
});
