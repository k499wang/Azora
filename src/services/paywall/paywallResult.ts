import type { CustomerInfo } from 'react-native-purchases';
import type { PaidIntroOffer } from './paywallTrialEligibility';

// 'monthly' names the short-plan slot; its product can bill weekly or monthly.
export type PaywallPackageId = 'annual' | 'monthly';

export type PaywallBillingPeriod = 'year' | 'month' | 'week';

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
  billingPeriod: PaywallBillingPeriod;
  trialLabel: string | null;
  trialDays: number | null;
  introOffer: PaidIntroOffer | null;
  isRecommended: boolean;
}

// Remote-controlled via the offering's `paywall_mode` metadata key. 'hard'
// removes the free path out of the onboarding paywall; anything else (or a
// missing/unloadable offering) falls back to 'soft' so a config or network
// problem can never lock users out of the app.
export type PaywallMode = 'hard' | 'soft';

// Remote-controlled via the offering's `paywall_layout` metadata key. 'long'
// shows the single scrolling page; 'long_then_trial' shows that page and sends
// its Continue to the deck's trial step; anything else keeps the step deck.
export type PaywallLayout = 'long' | 'long_then_trial' | 'deck';

export interface PaywallOffering {
  offeringIdentifier: string;
  experimentId: string | null;
  experimentVariant: string | null;
  paywallMode: PaywallMode;
  paywallLayout: PaywallLayout;
  // Remote-controlled via `benefits_title` metadata; `{plan}` becomes the goal noun.
  benefitsTitle: string | null;
  packages: PaywallPackageOption[];
}

export type PaywallResult =
  | {
      status: 'purchased' | 'restored';
      isPro: boolean;
      customerInfo: CustomerInfo;
      appUserId: string;
    }
  | { status: 'cancelled' }
  | {
      status: 'not_presented';
      reason: 'missing_offering' | 'missing_package' | 'not_ready' | 'signed_out';
    }
  | { status: 'failed'; errorCode: string | null; message: string };
