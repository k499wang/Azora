import { PURCHASES_ERROR_CODE, PACKAGE_TYPE, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import {
  getRevenueCatCustomerInfo,
  getRevenueCatOfferingForPlacement,
  hasCurrentRevenueCatIdentity,
  isRevenueCatReady,
  purchaseRevenueCatPackage,
  RevenueCatSignedOutError,
  restoreRevenueCatPurchases,
} from '../subscriptions/revenueCatClient';
import type { PaywallPlacementValue } from './paywallPlacements';
import type {
  PaywallOffering,
  PaywallPackageId,
  PaywallPackageOption,
  PaywallResult,
} from './paywallResult';

const PRO_ENTITLEMENT = 'pro';

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
  const packages = [annual, weekly]
    .filter((pkg): pkg is PurchasesPackage => pkg != null)
    .map(toPaywallPackageOption);

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
    return { status: 'purchased', isPro: hasProAccess(customerInfo) };
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
    return { status: 'restored', isPro: hasProAccess(customerInfo) };
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

function toPaywallPackageOption(pkg: PurchasesPackage): PaywallPackageOption {
  const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;

  return {
    id: isAnnual ? 'annual' : 'weekly',
    packageIdentifier: pkg.identifier,
    productIdentifier: pkg.product.identifier,
    title: isAnnual ? 'Annual' : 'Weekly',
    priceString: pkg.product.priceString,
    pricePerMonthString: pkg.product.pricePerMonthString,
    subscriptionPeriod: pkg.product.subscriptionPeriod,
    trialLabel: formatTrialLabel(pkg.product.introPrice),
    isRecommended: isAnnual,
  };
}

function formatTrialLabel(
  introPrice: PurchasesPackage['product']['introPrice'],
): string | null {
  if (introPrice == null || introPrice.price !== 0) {
    return null;
  }

  const unit = introPrice.periodUnit.toLowerCase();
  const suffix = introPrice.periodNumberOfUnits === 1 ? unit : `${unit}s`;
  return `${introPrice.periodNumberOfUnits} ${suffix} free`;
}

function hasProAccess(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT]?.isActive === true;
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
