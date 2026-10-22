import type { PaywallBillingPeriod, PaywallPackageOption } from '../../services/paywall';

/**
 * Price math shared by every paywall surface.
 *
 * The plan cards show a per-month figure, the daily anchor shows a per-day one,
 * and the exit offer discounts both. All three read the same two inputs, so they
 * parse prices in one place: a store's localized `priceString` is the only price
 * data every surface has, and it has to survive both decimal conventions
 * (`$39.99` and `39,99 €`).
 */

/** Minor units (cents) where the store gave them, else parsed from the string. */
export function parsePriceNumber(
  priceString: string | null | undefined,
): number | null {
  if (!priceString) return null;
  let cleaned = priceString.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalSep = lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : '';
  if (decimalSep) {
    const groupSep = decimalSep === ',' ? '.' : ',';
    cleaned = cleaned.split(groupSep).join('').replace(decimalSep, '.');
  } else {
    cleaned = cleaned.replace(/[.,]/g, '');
  }
  const value = parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Keeps the store's own symbol and side of the number (`$12.00`, `12,00 €`). */
export function formatCurrencyLike(template: string, value: number): string {
  const prefix = template.match(/^[^\d]+/)?.[0] ?? '';
  const suffix = template.match(/[^\d]+$/)?.[0] ?? '';
  const formatted = value.toFixed(2);
  return prefix ? `${prefix}${formatted}` : `${formatted}${suffix || '$'}`;
}

/**
 * Exact minor units. Prefer RevenueCat's integer cents; only fall back to
 * parsing the localized string when cents is unavailable.
 */
export function packagePriceCents(
  pkg: PaywallPackageOption | null | undefined,
): number | null {
  if (pkg?.priceCents != null && pkg.priceCents > 0) return pkg.priceCents;
  const value = parsePriceNumber(pkg?.priceString);
  return value == null ? null : Math.round(value * 100);
}

const MONTHS_PER_PERIOD: Record<PaywallBillingPeriod, number> = {
  year: 12,
  month: 1,
  week: 12 / 52,
};

function perMonthCents(pkg: PaywallPackageOption | null | undefined): number | null {
  const cents = packagePriceCents(pkg);
  return pkg == null || cents == null ? null : cents / MONTHS_PER_PERIOD[pkg.billingPeriod];
}

/** The annual card's headline figure: what the yearly charge works out to a month. */
export function computePerMonth(pkg: PaywallPackageOption): string | null {
  const cents = perMonthCents(pkg);
  return cents == null ? null : formatCurrencyLike(pkg.priceString, cents / 100);
}

export function computeDiscountPercent(
  anchor: PaywallPackageOption | null | undefined,
  discounted: PaywallPackageOption | null | undefined,
): number | null {
  const anchorCents = packagePriceCents(anchor);
  const discountCents = packagePriceCents(discounted);
  if (anchorCents == null || discountCents == null || discountCents >= anchorCents) {
    return null;
  }
  return Math.round((1 - discountCents / anchorCents) * 100);
}

export function computeAnnualSavings(
  annual: PaywallPackageOption | null | undefined,
  monthly: PaywallPackageOption | null | undefined,
): number | null {
  const annualCents = perMonthCents(annual);
  const monthlyCents = perMonthCents(monthly);
  if (annualCents == null || monthlyCents == null || monthlyCents <= 0) return null;
  const ratio = 1 - annualCents / monthlyCents;
  if (ratio <= 0) return null;
  return Math.round(ratio * 100);
}
