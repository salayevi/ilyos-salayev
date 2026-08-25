import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  detectRasterMime,
  isObviouslyPrivateHostname,
  isPrivateOrReservedIp,
} from "./image-security";

describe("screenshot byte tekshiruvi", () => {
  it("faqat PNG, JPEG va WebP imzolarini qabul qiladi", () => {
    assert.equal(
      detectRasterMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      "image/png",
    );
    assert.equal(detectRasterMime(Uint8Array.from([0xff, 0xd8, 0xff, 0xdb])), "image/jpeg");
    assert.equal(
      detectRasterMime(
        Uint8Array.from([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]),
      ),
      "image/webp",
    );
  });

  it("SVG va soxta image headerni qabul qilmaydi", () => {
    assert.equal(detectRasterMime(Buffer.from("<svg><script /></svg>")), null);
    assert.equal(detectRasterMime(Buffer.from("not really a jpeg")), null);
  });
});

describe("screenshot SSRF chegarasi", () => {
  it("mahalliy va literal hostlarni rad etadi", () => {
    for (const host of ["localhost", "api.localhost", "printer.local", "10.0.0.1", "::1"]) {
      assert.equal(isObviouslyPrivateHostname(host), true, host);
    }
    assert.equal(isObviouslyPrivateHostname("example.com"), false);
  });

  it("xususiy IPv4 va IPv6 diapazonlarini taniydi", () => {
    for (const ip of [
      "10.0.0.1",
      "127.0.0.1",
      "169.254.1.1",
      "172.16.0.1",
      "192.168.1.1",
      "::1",
      "fd00::1",
    ]) {
      assert.equal(isPrivateOrReservedIp(ip), true, ip);
    }
    assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
    assert.equal(isPrivateOrReservedIp("2606:4700:4700::1111"), false);
  });
});

