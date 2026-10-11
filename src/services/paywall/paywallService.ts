import { PURCHASES_ERROR_CODE, PACKAGE_TYPE, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import {
  getCurrentRevenueCatAppUserId,
  getRevenueCatCustomerInfo,
  getRevenueCatOfferingForPlacement,
  hasCurrentRevenueCatIdentity,
  isRevenueCatReady,
  checkRevenueCatTrialEligibility,
  purchaseRevenueCatPackage,
  RevenueCatSignedOutError,
  requireCurrentRevenueCatAppUserId,
  restoreRevenueCatPurchases,
} from '../subscriptions/revenueCatClient';
import {
  logRevenueCatCustomerInfoSnapshot,
  logRevenueCatPaywallOfferingSnapshot,
} from '../debug/revenueCatDebugSnapshot';
import { PaywallPlacement, type PaywallPlacementValue } from './paywallPlacements';
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
import { PRO_ENTITLEMENT, mapRevenueCatProEntitlement } from '../subscriptions/entitlementResolution';

const PRO_ENTITLEMENT_REFRESH_ATTEMPTS = 4;
const PRO_ENTITLEMENT_REFRESH_DELAY_MS = 750;
type PaywallFlow = 'purchase' | 'restore';

export interface PaywallOfferingResult {
  offering: PaywallOffering | null;
  revenueCatPackages: Record<PaywallPackageId, PurchasesPackage | null>;
}

// The last loaded offering per user and placement, so a paywall can mount with
// its content already in place instead of filling in mid slide-up. In memory
// only: a relaunch always reads RevenueCat fresh.
const offeringCache = new Map<string, PaywallOfferingResult>();

function offeringCacheKey(placement: PaywallPlacementValue): string | null {
  const appUserId = getCurrentRevenueCatAppUserId();
  return appUserId == null ? null : `${appUserId}:${placement}`;
}

export function getCachedPaywallOffering(
  placement: PaywallPlacementValue,
): PaywallOfferingResult | null {
  const key = offeringCacheKey(placement);
  return key == null ? null : offeringCache.get(key) ?? null;
}

/** Warms every placement's offering so the first paywall opens ready. */
export async function prefetchPaywallOfferings(): Promise<void> {
  await Promise.all(
    Object.values(PaywallPlacement).map((placement) =>
      getPaywallOffering(placement).catch(() => null),
    ),
  );
}

export async function getPaywallOffering(
  placement: PaywallPlacementValue,
): Promise<PaywallOfferingResult> {
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

  const result: PaywallOfferingResult = {
    offering: {
      offeringIdentifier: offering.identifier,
      experimentId: getMetadataString(offering.metadata, 'experiment_id'),
      experimentVariant: getMetadataString(offering.metadata, 'experiment_variant'),
      paywallMode:
        getMetadataString(offering.metadata, 'paywall_mode') === 'hard'
          ? 'hard'
          : 'soft',
      paywallLayout:
        getMetadataString(offering.metadata, 'paywall_layout') === 'long'
          ? 'long'
          : 'deck',
      packages,
    },
    revenueCatPackages: { weekly, annual },
  };
  const cacheKey = offeringCacheKey(placement);
  if (cacheKey != null) offeringCache.set(cacheKey, result);
  return result;
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
    const appUserId = requireCurrentRevenueCatAppUserId();
    const customerInfo = await purchaseRevenueCatPackage(revenueCatPackage);
    const confirmedCustomerInfo = await waitForProAccess(customerInfo, {
      flow: 'purchase',
      expected_entitlement_id: PRO_ENTITLEMENT,
      selected_package_identifier: revenueCatPackage.identifier,
      selected_product_identifier: revenueCatPackage.product.identifier,
    });
    if (getCurrentRevenueCatAppUserId() !== appUserId) throw new RevenueCatSignedOutError();
    return {
      status: 'purchased',
      isPro: hasProAccess(confirmedCustomerInfo),
      customerInfo: confirmedCustomerInfo,
      appUserId,
    };
  } catch (error) {
    return toFailedPaywallResult(error, 'purchase');
  }
}

export async function restorePaywallPurchases(): Promise<PaywallResult> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) {
    return { status: 'not_presented', reason: 'not_ready' };
  }

  try {
    const appUserId = requireCurrentRevenueCatAppUserId();
    const customerInfo = await restoreRevenueCatPurchases();
    const confirmedCustomerInfo = await waitForProAccess(customerInfo, {
      flow: 'restore',
      expected_entitlement_id: PRO_ENTITLEMENT,
    });
    if (getCurrentRevenueCatAppUserId() !== appUserId) throw new RevenueCatSignedOutError();
    return {
      status: 'restored',
      isPro: hasProAccess(confirmedCustomerInfo),
      customerInfo: confirmedCustomerInfo,
      appUserId,
    };
  } catch (error) {
    return toFailedPaywallResult(error, 'restore');
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
    priceCents: Number.isFinite(pkg.product.price)
      ? Math.round(pkg.product.price * 100)
      : null,
    pricePerMonthString: pkg.product.pricePerMonthString,
    currencyCode: pkg.product.currencyCode ?? null,
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

function getMetadataString(
  metadata: PurchasesOffering['metadata'],
  key: string,
): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
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
  return mapRevenueCatProEntitlement(customerInfo) != null;
}

async function waitForProAccess(
  initialCustomerInfo: CustomerInfo,
  debugPayload: Record<string, unknown>,
): Promise<CustomerInfo> {
  if (hasProAccess(initialCustomerInfo)) {
    logRevenueCatCustomerInfoSnapshot(
      'paywall_pro_entitlement_active_initially',
      initialCustomerInfo,
      debugPayload,
    );
    return initialCustomerInfo;
  }

  logRevenueCatCustomerInfoSnapshot(
    'paywall_pro_entitlement_missing_initially',
    initialCustomerInfo,
    debugPayload,
  );

  let customerInfo = initialCustomerInfo;
  for (let attempt = 0; attempt < PRO_ENTITLEMENT_REFRESH_ATTEMPTS; attempt += 1) {
    await delay(PRO_ENTITLEMENT_REFRESH_DELAY_MS);
    customerInfo = await getRevenueCatCustomerInfo();
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
      return customerInfo;
    }

    logRevenueCatCustomerInfoSnapshot(
      'paywall_pro_entitlement_missing_after_refresh',
      customerInfo,
      refreshPayload,
    );
  }

  return customerInfo;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function toFailedPaywallResult(error: unknown, flow: PaywallFlow): PaywallResult {
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

    if (error.code === PURCHASES_ERROR_CODE.INVALID_RECEIPT_ERROR) {
      return {
        status: 'failed',
        errorCode: error.code,
        message: getInvalidReceiptMessage(flow),
      };
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

function getInvalidReceiptMessage(flow: PaywallFlow): string {
  if (flow === 'restore') {
    return 'The App Store is still processing your receipt. Give it a moment, then try restoring purchases again.';
  }

  return 'The App Store is still processing your purchase. Give it a moment, then tap Restore Purchases to activate Azora Pro.';
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
