export type PaywallPackageId = 'weekly' | 'annual';

export interface PaywallPackageOption {
  id: PaywallPackageId;
  packageIdentifier: string;
  productIdentifier: string;
  title: string;
  priceString: string;
  pricePerMonthString: string | null;
  subscriptionPeriod: string | null;
  trialLabel: string | null;
  isRecommended: boolean;
}

export interface PaywallOffering {
  offeringIdentifier: string;
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
