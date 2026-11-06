import type { PaywallBillingPeriod, PaywallPackageOption } from '../../services/paywall';

const PLAN_NAME: Record<PaywallBillingPeriod, string> = {
  year: 'annual',
  month: 'monthly',
  week: 'weekly',
};

export interface ExitOfferPreview {
  trial?: 'free' | 'paid';
  period?: 'month' | 'week';
}

const PREVIEW_PLANS = {
  month: { title: 'Monthly', priceString: '$9.99', priceCents: 999 },
  week: { title: 'Weekly', priceString: '$2.99', priceCents: 299 },
} as const;

/** The one plan the offer sells: the offering's first slot, which holds a short plan when there is no annual. */
export function exitOfferPackage(
  packages: readonly PaywallPackageOption[] | null | undefined,
): PaywallPackageOption | null {
  return packages?.find((pkg) => pkg.id === 'annual') ?? packages?.[0] ?? null;
}

/** The regular plan a discount is measured against. Only the same billing period is a fair comparison. */
export function exitOfferAnchor(
  regularPackages: readonly PaywallPackageOption[] | null | undefined,
  offer: PaywallPackageOption | null,
): PaywallPackageOption | null {
  if (offer == null) return null;
  return regularPackages?.find((pkg) => pkg.billingPeriod === offer.billingPeriod) ?? null;
}

export function exitOfferCaption(offer: PaywallPackageOption, perMonth: string | null): string {
  if (offer.trialLabel != null) return `After your ${offer.trialLabel}`;
  if (offer.introOffer != null) return `After ${offer.introOffer.days} days for ${offer.introOffer.priceString}`;
  if (offer.billingPeriod === 'year' && perMonth != null) return `About ${perMonth}/month`;
  return `For ${PLAN_NAME[offer.billingPeriod]} plan`;
}

/** Dev preview only: dresses a real package as the plan being checked. */
export function previewExitOfferPackage(
  pkg: PaywallPackageOption,
  preview: ExitOfferPreview,
): PaywallPackageOption {
  return {
    ...pkg,
    ...(preview.period == null
      ? null
      : { ...PREVIEW_PLANS[preview.period], billingPeriod: preview.period, pricePerMonthString: null }),
    ...(preview.trial === 'free'
      ? { trialLabel: '7-day free trial', trialDays: 7, introOffer: null }
      : null),
    ...(preview.trial === 'paid'
      ? { trialLabel: null, trialDays: null, introOffer: { priceString: '$0.99', days: 7 } }
      : null),
  };
}
