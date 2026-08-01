/**
 * Display helpers shared by server and client components — deliberately kept
 * out of `queries.ts`, which is marked `server-only`.
 */

/**
 * Formats a price. Zero means "no public figure" — the panel leaves the field
 * at 0 for anything quoted per project — so callers get `null` and can fall
 * back to the price note instead of printing a misleading "$0".
 */
export function formatMoney(amount: number, currency: string): string | null {
  if (!amount) return null;
  try {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // An unknown ISO code throws rather than degrading; a plain suffix is fine.
    return `${amount.toLocaleString("uz-UZ")} ${currency}`;
  }
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
