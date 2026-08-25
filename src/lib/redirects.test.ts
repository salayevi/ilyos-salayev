import assert from "node:assert/strict";
import { describe, it } from "node:test";

import nextConfig from "../../next.config";

/**
 * The canonical-host redirect, pinned.
 *
 * This rule arrived on a branch of its own (`vercel-agent/canonical-www-redirect`,
 * commit `0e823e3`) and was ported here by hand. Before that branch could be
 * deleted, something had to hold the behaviour it carried — otherwise the only
 * record that the rule was ever deliberate would be a branch nobody kept.
 *
 * What matters and is asserted: the apex is the destination, the match is on
 * the `www` host rather than on a path, the whole path is carried across, and
 * the status is permanent. A 302 here would leave the duplicate indefinitely
 * indexable, which is the entire problem the rule exists to solve.
 */
describe("canonical host redirect", () => {
  it("www so'rovini apex'ga yo'naltiradi", async () => {
    assert.ok(typeof nextConfig.redirects === "function", "redirects() bo'lishi kerak");
    const rules = await nextConfig.redirects!();

    const rule = rules.find(
      (r) =>
        Array.isArray(r.has) &&
        r.has.some((h) => h.type === "host" && h.value === "www.ilyos-salayev.site"),
    );

    assert.ok(rule, "www uchun qoida topilmadi");
    assert.equal(rule.source, "/:path*", "butun yo'l qamrab olinishi kerak");
    assert.equal(rule.destination, "https://ilyos-salayev.site/:path*");
    assert.equal(rule.permanent, true, "301 bo'lishi kerak, 302 emas");
  });

  it("eski /services yangi katalogga yo'naltiriladi", async () => {
    const rules = await nextConfig.redirects!();
    const rule = rules.find((r) => r.source === "/services");

    assert.ok(rule, "/services uchun qoida topilmadi");
    assert.equal(rule.destination, "/pricing");
    // The URL is in the sitemap and has whatever authority it accrued; a
    // deletion would throw that away, a 301 carries it.
    assert.equal(rule.permanent, true);
  });

  it("boshqa hostlar tegilmaydi", async () => {
    const rules = await nextConfig.redirects!();
    // A rule matching the apex itself would loop forever.
    const loops = rules.filter(
      (r) =>
        Array.isArray(r.has) &&
        r.has.some((h) => h.type === "host" && h.value === "ilyos-salayev.site"),
    );
    assert.equal(loops.length, 0, "apex hostga qoida bo'lmasin — cheksiz sikl");
  });
});
