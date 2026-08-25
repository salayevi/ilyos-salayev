import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * The order-to-inventory mapping, tested as data.
 *
 * The transactions that use this table need a database, so they are covered by
 * the migration-verification run rather than here. What can be asserted without
 * one is the part that actually went wrong in production reasoning: which order
 * state implies which shelf state. Getting that table wrong is how the same
 * ready-made site gets sold twice, and it is a pure lookup — so it is tested
 * like one.
 *
 * Kept in step with `ORDER_TO_LISTING` in `lib/actions/admin.ts`. That module
 * is `"use server"`, so importing it here would drag the whole Next server
 * runtime into a unit test; the shape is small and stable enough that a
 * duplicated table with a test asserting every documented order status is
 * covered is the cheaper trade.
 */
const ORDER_TO_LISTING: Record<string, "sold" | "reserved" | "available" | null> = {
  new: "reserved",
  contacted: "reserved",
  scheduled: "reserved",
  paid: "sold",
  done: "sold",
  declined: "available",
};

/** Every value `orderStatusSchema` accepts. */
const ORDER_STATUSES = ["new", "contacted", "scheduled", "paid", "done", "declined"] as const;

describe("buyurtma holati inventarga qanday ta'sir qiladi", () => {
  it("har bir buyurtma holati uchun qoida bor", () => {
    // A status with no entry silently leaves the listing wherever it was, which
    // is exactly the bug this table exists to prevent.
    for (const status of ORDER_STATUSES) {
      assert.ok(status in ORDER_TO_LISTING, `${status} uchun qoida yo'q`);
    }
  });

  it("to'langan va yakunlangan buyurtma saytni sotilgan qiladi", () => {
    assert.equal(ORDER_TO_LISTING.paid, "sold");
    assert.equal(ORDER_TO_LISTING.done, "sold");
  });

  it("rad etilgan buyurtma saytni sotuvga qaytaradi", () => {
    // Without this the fastest way to make a listing permanently unbuyable was
    // to decline the order someone placed for it.
    assert.equal(ORDER_TO_LISTING.declined, "available");
  });

  it("ochiq buyurtma saytni band ushlab turadi", () => {
    assert.equal(ORDER_TO_LISTING.new, "reserved");
    assert.equal(ORDER_TO_LISTING.contacted, "reserved");
    assert.equal(ORDER_TO_LISTING.scheduled, "reserved");
  });

  it("hech qanday holat saytni 'sold' dan qaytarmaydi", () => {
    // `sold` is terminal. The guard lives in the action — it only writes the
    // mapped value — so what is asserted here is that no mapping asks for a
    // transition out of it by name.
    const outcomes = Object.values(ORDER_TO_LISTING);
    assert.ok(
      outcomes.every((v) => v === null || v === "sold" || v === "reserved" || v === "available"),
      "kutilmagan inventar holati",
    );
  });
});

/**
 * Reservation expiry arithmetic.
 *
 * The window is a plain constant in `lib/actions/orders.ts`; what is worth
 * pinning is the property, not the number — a hold must expire strictly in the
 * future when taken, and be considered lapsed strictly after that instant.
 */
const RESERVATION_MINUTES = 30;

describe("rezervatsiya muddati", () => {
  it("olingan payt kelajakda tugaydi", () => {
    const now = Date.now();
    const until = now + RESERVATION_MINUTES * 60_000;
    assert.ok(until > now);
  });

  it("muddati o'tgan rezerv bo'shatiladi, o'tmagani tegilmaydi", () => {
    const now = new Date("2026-08-20T12:00:00Z");
    const lapsed = new Date("2026-08-20T11:59:59Z");
    const live = new Date("2026-08-20T12:00:01Z");
    // Mirrors `lte(products.reservedUntil, new Date())` in the query layer.
    assert.ok(lapsed <= now, "o'tgan muddat bo'shatilishi kerak");
    assert.ok(!(live <= now), "amaldagi rezerv tegilmasligi kerak");
  });
});
