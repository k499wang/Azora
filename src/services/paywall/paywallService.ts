import { PURCHASES_ERROR_CODE, PACKAGE_TYPE, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import {
  getRevenueCatCustomerInfo,
  getRevenueCatOfferingForPlacement,
  hasCurrentRevenueCatIdentity,
  isRevenueCatReady,
  checkRevenueCatTrialEligibility,
  purchaseRevenueCatPackage,
  RevenueCatSignedOutError,
  restoreRevenueCatPurchases,
} from '../subscriptions/revenueCatClient';
import {
  logRevenueCatCustomerInfoSnapshot,
  logRevenueCatPaywallOfferingSnapshot,
} from '../debug/revenueCatDebugSnapshot';
import type { PaywallPlacementValue } from './paywallPlacements';
import type {
  PaywallOffering,
  PaywallPackageId,
  PaywallPackageOption,
  PaywallResult,
} from './paywallResult';
import {
  formatEligibleTrialLabel,
  hasFreeTrialIntroPrice,
  type TrialEligibilityStatus,
} from './paywallTrialEligibility';

const PRO_ENTITLEMENT = 'Azora  Pro';
const PRO_ENTITLEMENT_REFRESH_ATTEMPTS = 4;
const PRO_ENTITLEMENT_REFRESH_DELAY_MS = 750;

export async function getPaywallOffering(
  placement: PaywallPlacementValue,
): Promise<{
  offering: PaywallOffering | null;
  revenueCatPackages: Record<PaywallPackageId, PurchasesPackage | null>;
}> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) {
    return {
      offering: null,
      revenueCatPackages: { weekly: null, annual: null },
    };
  }

  let offering: PurchasesOffering | null;
  try {
    offering = await getRevenueCatOfferingForPlacement(placement);
  } catch (error) {
    if (error instanceof RevenueCatSignedOutError) {
      return {
        offering: null,
        revenueCatPackages: { weekly: null, annual: null },
      };
    }

    throw error;
  }

  if (offering == null) {
    return {
      offering: null,
      revenueCatPackages: { weekly: null, annual: null },
    };
  }

  const weekly = findPackage(offering, 'weekly');
  const annual = findPackage(offering, 'annual');
  const annualTrialEligibilityStatus = await getTrialEligibilityStatus(annual);
  const packages = [annual, weekly]
    .filter((pkg): pkg is PurchasesPackage => pkg != null)
    .map((pkg) =>
      toPaywallPackageOption(
        pkg,
        pkg === annual ? annualTrialEligibilityStatus : null,
      ),
    );

  logRevenueCatPaywallOfferingSnapshot('paywall_offering_loaded', {
    placement,
    offeringIdentifier: offering.identifier,
    packages: [annual, weekly]
      .filter((pkg): pkg is PurchasesPackage => pkg != null)
      .map((pkg) => ({
        id: pkg.packageType === PACKAGE_TYPE.ANNUAL ? 'annual' : 'weekly',
        productIdentifier: pkg.product.identifier,
        packageIdentifier: pkg.identifier,
        hasIntroOffer: pkg.product.introPrice != null,
        introOfferEligibilityStatus:
          pkg === annual ? annualTrialEligibilityStatus : null,
        introOfferLabel: formatEligibleTrialLabel({
          introPrice: pkg.product.introPrice,
          eligibilityStatus: pkg === annual ? annualTrialEligibilityStatus : null,
        }),
      })),
  });

  return {
    offering: {
      offeringIdentifier: offering.identifier,
      packages,
    },
    revenueCatPackages: { weekly, annual },
  };
}

export async function purchasePaywallPackage(
  revenueCatPackage: PurchasesPackage | null,
): Promise<PaywallResult> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) {
    return { status: 'not_presented', reason: 'not_ready' };
  }

  if (revenueCatPackage == null) {
    return { status: 'not_presented', reason: 'missing_package' };
  }

  try {
    const customerInfo = await purchaseRevenueCatPackage(revenueCatPackage);
    return {
      status: 'purchased',
      isPro: await waitForProAccess(customerInfo, {
        flow: 'purchase',
        expected_entitlement_id: PRO_ENTITLEMENT,
        selected_package_identifier: revenueCatPackage.identifier,
        selected_product_identifier: revenueCatPackage.product.identifier,
      }),
    };
  } catch (error) {
    return toFailedPaywallResult(error);
  }
}

export async function restorePaywallPurchases(): Promise<PaywallResult> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) {
    return { status: 'not_presented', reason: 'not_ready' };
  }

  try {
    const customerInfo = await restoreRevenueCatPurchases();
    return {
      status: 'restored',
      isPro: await waitForProAccess(customerInfo, {
        flow: 'restore',
        expected_entitlement_id: PRO_ENTITLEMENT,
      }),
    };
  } catch (error) {
    return toFailedPaywallResult(error);
  }
}

export async function refreshPaywallCustomerInfo(): Promise<{ isPro: boolean }> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) {
    return { isPro: false };
  }

  const customerInfo = await getRevenueCatCustomerInfo();
  return { isPro: hasProAccess(customerInfo) };
}

function findPackage(
  offering: PurchasesOffering,
  packageId: PaywallPackageId,
): PurchasesPackage | null {
  if (packageId === 'annual') {
    return (
      offering.annual ??
      offering.availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL) ??
      null
    );
  }

  return (
    offering.weekly ??
    offering.availablePackages.find((pkg) => pkg.packageType === PACKAGE_TYPE.WEEKLY) ??
    null
  );
}

function toPaywallPackageOption(
  pkg: PurchasesPackage,
  trialEligibilityStatus: TrialEligibilityStatus,
): PaywallPackageOption {
  const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;

  return {
    id: isAnnual ? 'annual' : 'weekly',
    packageIdentifier: pkg.identifier,
    productIdentifier: pkg.product.identifier,
    title: isAnnual ? 'Annual' : 'Weekly',
    priceString: pkg.product.priceString,
    pricePerMonthString: pkg.product.pricePerMonthString,
    subscriptionPeriod: pkg.product.subscriptionPeriod,
    trialLabel: isAnnual
      ? formatEligibleTrialLabel({
          introPrice: pkg.product.introPrice,
          eligibilityStatus: trialEligibilityStatus,
        })
      : null,
    isRecommended: isAnnual,
  };
}

async function getTrialEligibilityStatus(
  pkg: PurchasesPackage | null,
): Promise<TrialEligibilityStatus> {
  if (pkg == null || !hasFreeTrialIntroPrice(pkg.product.introPrice)) {
    return null;
  }

  try {
    const eligibility = await checkRevenueCatTrialEligibility([
      pkg.product.identifier,
    ]);
    return eligibility[pkg.product.identifier]?.status ?? null;
  } catch (error) {
    logRevenueCatPaywallOfferingSnapshot('paywall_trial_eligibility_check_failed', {
      productIdentifier: pkg.product.identifier,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function hasProAccess(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT]?.isActive === true;
}

async function waitForProAccess(
  initialCustomerInfo: CustomerInfo,
  debugPayload: Record<string, unknown>,
): Promise<boolean> {
  if (hasProAccess(initialCustomerInfo)) {
    logRevenueCatCustomerInfoSnapshot(
      'paywall_pro_entitlement_active_initially',
      initialCustomerInfo,
      debugPayload,
    );
    return true;
  }

  logRevenueCatCustomerInfoSnapshot(
    'paywall_pro_entitlement_missing_initially',
    initialCustomerInfo,
    debugPayload,
  );

  for (let attempt = 0; attempt < PRO_ENTITLEMENT_REFRESH_ATTEMPTS; attempt += 1) {
    await delay(PRO_ENTITLEMENT_REFRESH_DELAY_MS);
    const customerInfo = await getRevenueCatCustomerInfo();
    const refreshPayload = {
      ...debugPayload,
      refresh_attempt: attempt + 1,
      refresh_attempts: PRO_ENTITLEMENT_REFRESH_ATTEMPTS,
    };

    if (hasProAccess(customerInfo)) {
      logRevenueCatCustomerInfoSnapshot(
        'paywall_pro_entitlement_active_after_refresh',
        customerInfo,
        refreshPayload,
      );
      return true;
    }

    logRevenueCatCustomerInfoSnapshot(
      'paywall_pro_entitlement_missing_after_refresh',
      customerInfo,
      refreshPayload,
    );
  }

  return false;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function toFailedPaywallResult(error: unknown): PaywallResult {
  if (error instanceof RevenueCatSignedOutError) {
    return { status: 'not_presented', reason: 'signed_out' };
  }

  if (isRevenueCatError(error)) {
    if (
      error.userCancelled === true ||
      error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return { status: 'cancelled' };
    }

    return {
      status: 'failed',
      errorCode: error.code,
      message: error.message || 'Purchase failed. Please try again.',
    };
  }

  return {
    status: 'failed',
    errorCode: null,
    message: error instanceof Error ? error.message : 'Purchase failed. Please try again.',
  };
}

function isRevenueCatError(error: unknown): error is {
  code: string;
  message: string;
  userCancelled?: boolean | null;
} {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    'message' in error
  );
}
