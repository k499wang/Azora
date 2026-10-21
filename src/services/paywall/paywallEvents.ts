import type { PaywallPackageOption } from './paywallResult';
import type { PaywallPlacementValue } from './paywallPlacements';
import type { FeatureKeyValue } from '../subscriptions/featureAccess';

export type PaywallStepKey = 'benefits' | 'hero' | 'reminder' | 'plan';

export interface PaywallStepView {
  step: PaywallStepKey;
  index: number;
  count: number;
}

export interface PaywallEventProperties {
  [key: string]: string | number | boolean | null;
  placement: PaywallPlacementValue;
  feature: FeatureKeyValue | null;
  source_screen: string | null;
  source_action: string | null;
  paywall_view_id: string | null;
  offering_id: string | null;
  experiment_id: string | null;
  experiment_variant: string | null;
  monthly_product_id: string | null;
  monthly_price: string | null;
  monthly_price_cents: number | null;
  annual_product_id: string | null;
  annual_price: string | null;
  annual_price_cents: number | null;
  currency: string | null;
  has_trial: boolean;
}

export function buildPaywallEventProperties(options: {
  placement: PaywallPlacementValue;
  feature?: FeatureKeyValue | null;
  sourceScreen?: string | null;
  sourceAction?: string | null;
  paywallViewId?: string | null;
  offeringIdentifier?: string | null;
  experimentId?: string | null;
  experimentVariant?: string | null;
  packages?: PaywallPackageOption[];
}): PaywallEventProperties {
  const monthly = options.packages?.find((pkg) => pkg.id === 'monthly') ?? null;
  const annual = options.packages?.find((pkg) => pkg.id === 'annual') ?? null;

  return {
    placement: options.placement,
    feature: options.feature ?? null,
    source_screen: options.sourceScreen ?? null,
    source_action: options.sourceAction ?? null,
    paywall_view_id: options.paywallViewId ?? null,
    offering_id: options.offeringIdentifier ?? null,
    experiment_id: options.experimentId ?? null,
    experiment_variant: options.experimentVariant ?? null,
    monthly_product_id: monthly?.productIdentifier ?? null,
    monthly_price: monthly?.priceString ?? null,
    monthly_price_cents: monthly?.priceCents ?? null,
    annual_product_id: annual?.productIdentifier ?? null,
    annual_price: annual?.priceString ?? null,
    annual_price_cents: annual?.priceCents ?? null,
    currency: monthly?.currencyCode ?? annual?.currencyCode ?? null,
    has_trial: annual?.trialLabel != null,
  };
}
