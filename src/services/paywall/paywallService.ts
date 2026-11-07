import { PURCHASES_ERROR_CODE, PACKAGE_TYPE, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import {
  getCurrentRevenueCatAppUserId,
  getRevenueCatCustomerInfo,
  getRevenueCatOffering,
  getRevenueCatOfferings,
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
  PaywallBillingPeriod,
  PaywallLayout,
  PaywallPlanPicker,
  PaywallOffering,
  PaywallPackageId,
  PaywallPackageOption,
  PaywallResult,
} from './paywallResult';
import {
  eligiblePaidIntroOffer,
  formatEligibleTrialLabel,
  trialLengthDays,
  type TrialEligibilityStatus,
} from './paywallTrialEligibility';
import { PRO_ENTITLEMENT, mapRevenueCatProEntitlement } from '../subscriptions/entitlementResolution';

const PRO_ENTITLEMENT_REFRESH_ATTEMPTS = 4;
const PRO_ENTITLEMENT_REFRESH_DELAY_MS = 750;
/** its own RevenueCat offering, holding the monthly or weekly package a paywall shows when its offering's own short plan has no paid intro */
const PAID_TRIAL_MONTHLY_OFFERING = 'paid_trial_monthly';

type PaywallFlow = 'purchase' | 'restore';

export interface PaywallOfferingResult {
  offering: PaywallOffering | null;
  revenueCatPackages: Record<PaywallPackageId, PurchasesPackage | null>;
}

// The last loaded offering per user and placement, so a paywall can mount with
// its content already in place instead of filling in mid slide-up. In memory
// only: a relaunch always reads RevenueCat fresh.
const offeringCache = new Map<string, PaywallOfferingResult>();

function offeringCacheKey(placement: PaywallPlacementValue, offeringIdentifier?: string): string | null {
  const appUserId = getCurrentRevenueCatAppUserId();
  if (appUserId == null) return null;
  return offeringIdentifier == null ? `${appUserId}:${placement}` : `${appUserId}:${placement}:offering:${offeringIdentifier}`;
}

export function getCachedPaywallOffering(
  placement: PaywallPlacementValue,
  offeringIdentifier?: string,
): PaywallOfferingResult | null {
  const key = offeringCacheKey(placement, offeringIdentifier);
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
  offeringIdentifier?: string,
): Promise<PaywallOfferingResult> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) {
    return {
      offering: null,
      revenueCatPackages: { annual: null, monthly: null },
    };
  }

  const requestAppUserId = requireCurrentRevenueCatAppUserId();

  let offering: PurchasesOffering | null;
  try {
    offering = offeringIdentifier == null
      ? await getRevenueCatOfferingForPlacement(placement)
      : await getRevenueCatOffering(offeringIdentifier);
  } catch (error) {
    if (error instanceof RevenueCatSignedOutError) {
      return {
        offering: null,
        revenueCatPackages: { annual: null, monthly: null },
      };
    }

    throw error;
  }

  if (offering == null) {
    return {
      offering: null,
      revenueCatPackages: { annual: null, monthly: null },
    };
  }

  // An offering with weekly + monthly and no annual puts monthly in the first slot.
  const ownAnnual = findPackage(offering, 'annual');
  const ownMonthly = findPackageOfType(offering, PACKAGE_TYPE.MONTHLY);
  const ownWeekly = findPackageOfType(offering, PACKAGE_TYPE.WEEKLY);
  const pairsShortPlans = ownAnnual == null && ownMonthly != null && ownWeekly != null;
  const annual = pairsShortPlans ? ownMonthly : ownAnnual;
  // Explicit offering access must show its own products for App Review.
  const monthly = pairsShortPlans
    ? ownWeekly
    // So must the exit offer: it may only sell what its own offering holds.
    : offeringIdentifier != null || placement === PaywallPlacement.ExitDiscount
      ? findPackage(offering, 'monthly')
      : await findPaidTrialMonthlyPackage(offering);
  const [annualTrialEligibilityStatus, monthlyIntroEligibilityStatus] = await Promise.all([
    getTrialEligibilityStatus(annual),
    getTrialEligibilityStatus(monthly),
  ]);
  if (getCurrentRevenueCatAppUserId() !== requestAppUserId) throw new RevenueCatSignedOutError();
  const packages = [annual, monthly]
    .filter((pkg): pkg is PurchasesPackage => pkg != null)
    .map((pkg) =>
      toPaywallPackageOption(
        pkg,
        pkg === annual ? 'annual' : 'monthly',
        pkg === annual ? annualTrialEligibilityStatus : monthlyIntroEligibilityStatus,
      ),
    );

  logRevenueCatPaywallOfferingSnapshot('paywall_offering_loaded', {
    placement,
    offeringIdentifier: offering.identifier,
    packages: [annual, monthly]
      .filter((pkg): pkg is PurchasesPackage => pkg != null)
      .map((pkg) => ({
        id: pkg === annual ? 'annual' : 'monthly',
        productIdentifier: pkg.product.identifier,
        packageIdentifier: pkg.identifier,
        hasIntroOffer: pkg.product.introPrice != null,
        introOfferEligibilityStatus:
          pkg === annual ? annualTrialEligibilityStatus : monthlyIntroEligibilityStatus,
        introOfferLabel: formatEligibleTrialLabel({
          introPrice: pkg.product.introPrice,
          eligibilityStatus: pkg === annual ? annualTrialEligibilityStatus : monthlyIntroEligibilityStatus,
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
      paywallLayout: toPaywallLayout(getMetadataString(offering.metadata, 'paywall_layout')),
      planPicker: toPlanPicker(getMetadataString(offering.metadata, 'plan_picker')),
      benefitsTitle: getMetadataString(offering.metadata, 'benefits_title'),
      onlyPackageId: toOnlyPackageId(
        getMetadataString(offering.metadata, 'trial_package'),
        getMetadataString(offering.metadata, 'trial_options'),
        packages,
      ),
      trialTitle: getMetadataString(offering.metadata, 'trial_title'),
      packages,
    },
    revenueCatPackages: { annual, monthly },
  };
  const cacheKey = offeringCacheKey(placement, offeringIdentifier);
  if (cacheKey != null) offeringCache.set(cacheKey, result);
  return result;
}

export async function getPaywallReviewOfferings(): Promise<Array<{
  identifier: string;
  title: string;
  packageCount: number;
  hasFirstPlan: boolean;
  hasShortPlan: boolean;
}>> {
  const appUserId = requireCurrentRevenueCatAppUserId();
  if (!isRevenueCatReady()) throw new Error('Subscription options are not ready. Please try again.');
  const offerings = await getRevenueCatOfferings();
  if (getCurrentRevenueCatAppUserId() !== appUserId) throw new RevenueCatSignedOutError();
  return Object.values(offerings)
    .filter((offering) => offering.availablePackages.length > 0)
    .map((offering) => ({
      identifier: offering.identifier,
      title: offering.serverDescription || offering.identifier,
      packageCount: offering.availablePackages.length,
      hasFirstPlan: findPackage(offering, 'annual') != null || (
        findPackageOfType(offering, PACKAGE_TYPE.MONTHLY) != null
        && findPackageOfType(offering, PACKAGE_TYPE.WEEKLY) != null
      ),
      hasShortPlan: offering.availablePackages.some(isShortPlanPackage),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
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
    offering.monthly ??
    offering.weekly ??
    offering.availablePackages.find(isShortPlanPackage) ??
    null
  );
}

function findPackageOfType(
  offering: PurchasesOffering,
  packageType: PACKAGE_TYPE,
): PurchasesPackage | null {
  return offering.availablePackages.find((pkg) => pkg.packageType === packageType) ?? null;
}

function isShortPlanPackage(pkg: PurchasesPackage): boolean {
  return pkg.packageType === PACKAGE_TYPE.MONTHLY || pkg.packageType === PACKAGE_TYPE.WEEKLY;
}

async function findPaidTrialMonthlyPackage(
  placementOffering: PurchasesOffering,
): Promise<PurchasesPackage | null> {
  const ownShortPlan = placementOffering.availablePackages.find(isShortPlanPackage);
  if (ownShortPlan?.product.introPrice != null) return ownShortPlan;

  try {
    const paidTrial = await getRevenueCatOffering(PAID_TRIAL_MONTHLY_OFFERING);
    const pkg = paidTrial?.availablePackages.find(isShortPlanPackage);
    if (pkg != null) return pkg;
  } catch (error) {
    logRevenueCatPaywallOfferingSnapshot('paywall_paid_trial_offering_failed', {
      offeringIdentifier: PAID_TRIAL_MONTHLY_OFFERING,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }

  return findPackage(placementOffering, 'monthly');
}

function toPaywallPackageOption(
  pkg: PurchasesPackage,
  id: PaywallPackageId,
  trialEligibilityStatus: TrialEligibilityStatus,
): PaywallPackageOption {
  const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
  const isWeekly = pkg.packageType === PACKAGE_TYPE.WEEKLY;
  const trialLabel = formatEligibleTrialLabel({
    introPrice: pkg.product.introPrice,
    eligibilityStatus: trialEligibilityStatus,
  });

  return {
    id,
    packageIdentifier: pkg.identifier,
    productIdentifier: pkg.product.identifier,
    title: isAnnual ? 'Annual' : isWeekly ? 'Weekly' : 'Monthly',
    priceString: pkg.product.priceString,
    priceCents: Number.isFinite(pkg.product.price)
      ? Math.round(pkg.product.price * 100)
      : null,
    pricePerMonthString: pkg.product.pricePerMonthString,
    currencyCode: pkg.product.currencyCode ?? null,
    subscriptionPeriod: pkg.product.subscriptionPeriod,
    billingPeriod: isAnnual ? 'year' : isWeekly ? 'week' : 'month',
    trialLabel,
    trialDays: trialLabel != null
      ? trialLengthDays(pkg.product.introPrice)
      : null,
    introOffer: eligiblePaidIntroOffer({
      introPrice: pkg.product.introPrice,
      eligibilityStatus: trialEligibilityStatus,
    }),
    isRecommended: id === 'annual',
  };
}

const TRIAL_PACKAGE_PERIODS: Record<string, PaywallBillingPeriod> = {
  annual: 'year',
  monthly: 'month',
  weekly: 'week',
};

function toOnlyPackageId(
  trialPackage: string | null,
  trialOptions: string | null,
  packages: PaywallPackageOption[],
): PaywallPackageId | null {
  const period = trialPackage == null ? undefined : TRIAL_PACKAGE_PERIODS[trialPackage];
  if (period != null) {
    const match = packages.find((pkg) => pkg.billingPeriod === period);
    return match?.id ?? (period === 'year' ? 'annual' : 'monthly');
  }
  return trialOptions === 'paid_only' ? 'monthly' : null;
}

function toPlanPicker(value: string | null): PaywallPlanPicker {
  return value === 'side_by_side' ? value : 'stacked';
}

function toPaywallLayout(value: string | null): PaywallLayout {
  return value === 'long' || value === 'long_then_trial' || value === 'plan' || value === 'plan_first_week' ? value : 'deck';
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
  if (pkg == null || pkg.product.introPrice == null) {
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
