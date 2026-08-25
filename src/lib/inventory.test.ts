import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canTransitionOrder,
  listingStatusForOrder,
  OPEN_ORDER_STATUSES,
  ORDER_STATUSES,
} from "./inventory";

describe("buyurtma va inventar holatlari", () => {
  it("har bir order holati uchun aniq inventar natijasi bor", () => {
    const expected = {
      new: "reserved",
      contacted: "reserved",
      scheduled: "reserved",
      paid: "sold",
      done: "sold",
      declined: "available",
      expired: "available",
    } as const;

    for (const status of ORDER_STATUSES) {
      assert.equal(listingStatusForOrder(status), expected[status]);
    }
  });

  it("faqat faol orderlar rezervatsiyani ushlab turadi", () => {
    assert.deepEqual(OPEN_ORDER_STATUSES, ["new", "contacted", "scheduled"]);
  });

  it("to'langan orderni qayta ochish yoki rad etish mumkin emas", () => {
    assert.equal(canTransitionOrder("paid", "done"), true);
    assert.equal(canTransitionOrder("paid", "declined"), false);
    assert.equal(canTransitionOrder("done", "new"), false);
    assert.equal(canTransitionOrder("done", "declined"), false);
  });

  it("eskirgan va rad etilgan order terminal holatda qoladi", () => {
    for (const terminal of ["expired", "declined"] as const) {
      for (const next of ORDER_STATUSES) {
        assert.equal(canTransitionOrder(terminal, next), next === terminal);
      }
    }
  });

  it("ochiq order xavfsiz savdo oqimi bo'ylab yuradi", () => {
    assert.equal(canTransitionOrder("new", "contacted"), true);
    assert.equal(canTransitionOrder("contacted", "scheduled"), true);
    assert.equal(canTransitionOrder("scheduled", "paid"), true);
    assert.equal(canTransitionOrder("new", "done"), false);
  });
});
