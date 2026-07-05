export type PaywallPackageId = 'weekly' | 'annual';

export interface PaywallPackageOption {
  id: PaywallPackageId;
  packageIdentifier: string;
  productIdentifier: string;
  title: string;
  priceString: string;
  priceCents: number | null;
  pricePerMonthString: string | null;
  currencyCode: string | null;
  subscriptionPeriod: string | null;
  trialLabel: string | null;
  isRecommended: boolean;
}

// Remote-controlled via the offering's `paywall_mode` metadata key. 'hard'
// removes the free path out of the onboarding paywall; anything else (or a
// missing/unloadable offering) falls back to 'soft' so a config or network
// problem can never lock users out of the app.
export type PaywallMode = 'hard' | 'soft';

export interface PaywallOffering {
  offeringIdentifier: string;
  experimentId: string | null;
  experimentVariant: string | null;
  paywallMode: PaywallMode;
  packages: PaywallPackageOption[];
}

export type PaywallResult =
  | { status: 'purchased'; isPro: boolean }
  | { status: 'restored'; isPro: boolean }
  | { status: 'cancelled' }
  | {
      status: 'not_presented';
      reason: 'missing_offering' | 'missing_package' | 'not_ready' | 'signed_out';
    }
  | { status: 'failed'; errorCode: string | null; message: string };
