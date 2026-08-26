import assert from "node:assert/strict";
import { describe, it } from "node:test";

import nextConfig from "../../next.config";

describe("production security headerlari", () => {
  it("barcha sahifalarga asosiy browser himoyalarini qo'yadi", async () => {
    assert.ok(typeof nextConfig.headers === "function");
    const rules = await nextConfig.headers!();
    const global = rules.find((rule) => rule.source === "/:path*");
    assert.ok(global, "global header qoidasi topilmadi");
    const headers = new Map(global.headers.map((header) => [header.key, header.value]));

    assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(headers.get("X-Frame-Options"), "DENY");
    assert.match(headers.get("Strict-Transport-Security") ?? "", /max-age=/);
    assert.match(headers.get("Content-Security-Policy") ?? "", /frame-ancestors 'none'/);
    assert.match(headers.get("Content-Security-Policy") ?? "", /object-src 'none'/);
  });

  it("framework versiyasini response headerda oshkor qilmaydi", () => {
    assert.equal(nextConfig.poweredByHeader, false);
  });
});

