import type { PaywallPackageOption } from './paywallResult';
import type { PaywallPlacementValue } from './paywallPlacements';

export interface PaywallEventProperties {
  [key: string]: string | number | boolean | null;
  placement: PaywallPlacementValue;
  source_screen: string | null;
  source_action: string | null;
  paywall_view_id: string | null;
  offering_id: string | null;
  experiment_id: string | null;
  experiment_variant: string | null;
  weekly_product_id: string | null;
  weekly_price: string | null;
  weekly_price_cents: number | null;
  annual_product_id: string | null;
  annual_price: string | null;
  annual_price_cents: number | null;
  currency: string | null;
  has_trial: boolean;
}

export function buildPaywallEventProperties(options: {
  placement: PaywallPlacementValue;
  sourceScreen?: string | null;
  sourceAction?: string | null;
  paywallViewId?: string | null;
  offeringIdentifier?: string | null;
  experimentId?: string | null;
  experimentVariant?: string | null;
  packages?: PaywallPackageOption[];
}): PaywallEventProperties {
  const weekly = options.packages?.find((pkg) => pkg.id === 'weekly') ?? null;
  const annual = options.packages?.find((pkg) => pkg.id === 'annual') ?? null;

  return {
    placement: options.placement,
    source_screen: options.sourceScreen ?? null,
    source_action: options.sourceAction ?? null,
    paywall_view_id: options.paywallViewId ?? null,
    offering_id: options.offeringIdentifier ?? null,
    experiment_id: options.experimentId ?? null,
    experiment_variant: options.experimentVariant ?? null,
    weekly_product_id: weekly?.productIdentifier ?? null,
    weekly_price: weekly?.priceString ?? null,
    weekly_price_cents: weekly?.priceCents ?? null,
    annual_product_id: annual?.productIdentifier ?? null,
    annual_price: annual?.priceString ?? null,
    annual_price_cents: annual?.priceCents ?? null,
    currency: weekly?.currencyCode ?? annual?.currencyCode ?? null,
    has_trial: annual?.trialLabel != null,
  };
}
