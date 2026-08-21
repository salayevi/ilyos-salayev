/**
 * Display helpers shared by server and client components — deliberately kept
 * out of `queries.ts`, which is marked `server-only`.
 */

/**
 * Groups thousands, by hand, on purpose.
 *
 * `toLocaleString("uz-UZ")` is not the same function on both sides of the
 * wire. Node ships full ICU and returns `4 500` with a no-break space; the
 * browsers this site is actually opened in return `4,500`. The calculator
 * renders on the server and then re-renders in the browser from the same
 * numbers, so that difference is a hydration mismatch — React patches the text
 * silently and the price visibly changes shape a moment after the page loads.
 *
 * Doing the grouping ourselves makes the output a pure function of the number.
 * The separator is a literal no-break space so a price never wraps across two
 * lines mid-figure.
 */
function group(amount: number): string {
  const whole = Math.round(Math.abs(amount)).toString();
  const parts: string[] = [];
  for (let i = whole.length; i > 0; i -= 3) parts.unshift(whole.slice(Math.max(0, i - 3), i));
  return (amount < 0 ? "-" : "") + parts.join(" ");
}

/**
 * Formats a price for display.
 *
 * `Intl` with `style: "currency"` renders USD as `4 500 US$` under `uz-UZ`,
 * which is correct and reads as a conversion rate rather than a price. Dollars
 * are quoted with a leading `$` everywhere this business actually quotes them.
 * Other currencies keep the suffix form, which is how som and euro are written
 * here anyway.
 *
 * Zero means "no public figure" — the panel leaves the field at 0 for anything
 * quoted per project — so callers get `null` and can fall back to the price
 * note instead of printing a misleading "$0".
 */
export function formatMoney(amount: number, currency: string): string | null {
  if (!amount) return null;
  return formatMoneyExact(amount, currency);
}

/**
 * The same, but for a figure that is genuinely zero rather than absent.
 *
 * A calculator line that really costs nothing still has to say so, which is a
 * different question from a price field nobody filled in.
 */
export function formatMoneyExact(amount: number, currency: string): string {
  return currency === "USD" ? `$${group(amount)}` : `${group(amount)} ${currency}`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  scheduled: "Rejalashtirildi",
  paid: "To'landi",
  done: "Yakunlandi",
  declined: "Rad etildi",
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  available: "Sotuvda",
  reserved: "Band qilingan",
  sold: "Sotilgan",
};
