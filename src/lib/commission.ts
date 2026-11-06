// Commission math for the listings money strip (v0.62.0, owner decision "b").
// Default is 300 bps (3.00% listing side). Each listing may override it, and a
// seller-paid buyer concession is tracked separately in basis points.

export const DEFAULT_COMMISSION_BPS = 300;
export const MIN_COMMISSION_BPS = 0;
export const MAX_COMMISSION_BPS = 1000;

export function clampCommissionBps(bps: unknown, fallback = DEFAULT_COMMISSION_BPS): number {
  const n = typeof bps === "number" ? bps : Number(bps);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_COMMISSION_BPS, Math.max(MIN_COMMISSION_BPS, Math.round(n)));
}

export function listingPriceBasis(l: { soldPrice?: number | null; listPrice?: number | null }): number {
  return Number(l.soldPrice || l.listPrice || 0) || 0;
}

export function commissionForListing(l: {
  soldPrice?: number | null;
  listPrice?: number | null;
  commissionBps?: number | null;
}): number {
  const bps = clampCommissionBps(l.commissionBps ?? DEFAULT_COMMISSION_BPS);
  return Math.round(listingPriceBasis(l) * (bps / 10000));
}

export function buyerConcessionForListing(l: {
  soldPrice?: number | null;
  listPrice?: number | null;
  buyerConcessionBps?: number | null;
}): number {
  const bps = clampCommissionBps(l.buyerConcessionBps ?? 0, 0);
  return Math.round(listingPriceBasis(l) * (bps / 10000));
}

export const COMMISSION_NEGOTIABILITY_NOTICE =
  "Real estate commissions are not set by law and are fully negotiable.";
