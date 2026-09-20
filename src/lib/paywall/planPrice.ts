import type { PaywallPackageOption } from '../../services/paywall';

/**
 * Price math shared by every paywall surface.
 *
 * The plan cards show a per-week figure, the daily anchor shows a per-day one,
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

/** The annual card's headline figure: what the yearly charge works out to a week. */
export function computePerWeek(pkg: PaywallPackageOption): string | null {
  const cents = packagePriceCents(pkg);
  if (cents == null) return null;
  const perWeekCents = pkg.id === 'annual' ? cents / 52 : cents;
  return formatCurrencyLike(pkg.priceString, perWeekCents / 100);
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
  weekly: PaywallPackageOption | null | undefined,
): number | null {
  const annualCents = packagePriceCents(annual);
  const weeklyCents = packagePriceCents(weekly);
  if (annualCents == null || weeklyCents == null || weeklyCents <= 0) return null;
  const ratio = 1 - annualCents / 52 / weeklyCents;
  if (ratio <= 0) return null;
  return Math.round(ratio * 100);
}
