import type { PaywallPackageOption } from './paywallResult';
import type { PaywallPlacementValue } from './paywallPlacements';

export interface PaywallEventProperties {
  [key: string]: string | boolean | null;
  placement: PaywallPlacementValue;
  source_screen: string | null;
  offering_id: string | null;
  weekly_product_id: string | null;
  weekly_price: string | null;
  annual_product_id: string | null;
  annual_price: string | null;
  has_trial: boolean;
}

export function buildPaywallEventProperties(options: {
  placement: PaywallPlacementValue;
  sourceScreen?: string | null;
  offeringIdentifier?: string | null;
  packages?: PaywallPackageOption[];
}): PaywallEventProperties {
  const weekly = options.packages?.find((pkg) => pkg.id === 'weekly') ?? null;
  const annual = options.packages?.find((pkg) => pkg.id === 'annual') ?? null;

  return {
    placement: options.placement,
    source_screen: options.sourceScreen ?? null,
    offering_id: options.offeringIdentifier ?? null,
    weekly_product_id: weekly?.productIdentifier ?? null,
    weekly_price: weekly?.priceString ?? null,
    annual_product_id: annual?.productIdentifier ?? null,
    annual_price: annual?.priceString ?? null,
    has_trial: annual?.trialLabel != null,
  };
}
