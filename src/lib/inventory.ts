/**
 * Order and inventory rules shared by the public order flow, the owner panel,
 * and regression tests. Keeping the state machine out of a `"use server"`
 * module means the tests exercise the exact rules production uses instead of
 * maintaining a second, easily-drifted lookup table.
 */

export const ORDER_STATUSES = [
  "new",
  "contacted",
  "scheduled",
  "paid",
  "done",
  "declined",
  "expired",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type ListingStatus = "available" | "reserved" | "sold";

export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = ["new", "contacted", "scheduled"];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["contacted", "scheduled", "paid", "declined", "expired"],
  contacted: ["scheduled", "paid", "declined", "expired"],
  scheduled: ["paid", "declined", "expired"],
  paid: ["done"],
  done: [],
  declined: [],
  expired: [],
};

/** A sold listing is terminal; reversing a sale needs a separate refund flow. */
export function canTransitionOrder(current: OrderStatus, next: OrderStatus): boolean {
  return current === next || TRANSITIONS[current].includes(next);
}

/** The shelf state an owned, valid product order implies. */
export function listingStatusForOrder(status: OrderStatus): ListingStatus | null {
  if (status === "paid" || status === "done") return "sold";
  if (status === "new" || status === "contacted" || status === "scheduled") return "reserved";
  if (status === "declined" || status === "expired") return "available";
  return null;
}

export function isOpenOrderStatus(status: string): status is (typeof OPEN_ORDER_STATUSES)[number] {
  return (OPEN_ORDER_STATUSES as readonly string[]).includes(status);
}

export function isOrderStatus(status: string): status is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(status);
}
