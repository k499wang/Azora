import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  type CustomerInfo,
  type IntroEligibility,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { getRevenueCatApiKey, isRevenueCatSupportedPlatform } from './revenueCatConfig';
import { logIdentitySyncDebug } from '../debug/identitySyncLogger.js';
import {
  createRevenueCatClient,
  RevenueCatSignedOutError,
  type RevenueCatIdentityUser,
} from './revenueCatClientCore';

const revenueCatClient = createRevenueCatClient({
  apiKey: getRevenueCatApiKey(),
  debugLogLevel: LOG_LEVEL.DEBUG,
  errorLogLevel: LOG_LEVEL.ERROR,
  isDev: __DEV__,
  isSupportedPlatform: isRevenueCatSupportedPlatform,
  sdk: {
    configure: (options) => {
      Purchases.configure(options);
    },
    collectDeviceIdentifiers: () => Purchases.collectDeviceIdentifiers(),
    enableAdServicesAttributionTokenCollection: () =>
      Purchases.enableAdServicesAttributionTokenCollection(),
    getCustomerInfo: () => Purchases.getCustomerInfo(),
    getCurrentOfferingForPlacement: (placement) =>
      Purchases.getCurrentOfferingForPlacement(placement),
    getOfferings: () => Purchases.getOfferings(),
    isConfigured: () => Purchases.isConfigured(),
    logIn: async (appUserId) => {
      await Purchases.logIn(appUserId);
    },
    purchasePackage: async (revenueCatPackage) =>
      Purchases.purchasePackage(revenueCatPackage as PurchasesPackage),
    restorePurchases: () => Purchases.restorePurchases(),
    setEmail: (email) => Purchases.setEmail(email),
    setLogLevel: async (level) => {
      await Purchases.setLogLevel(level as LOG_LEVEL);
    },
  },
});

export { RevenueCatSignedOutError, type RevenueCatIdentityUser };

export type RevenueCatAvailability =
  | { status: 'ready' }
  | { status: 'unavailable'; reason: 'unsupported_platform' | 'missing_api_key' };

export function getRevenueCatAvailability(): RevenueCatAvailability {
  if (!isRevenueCatSupportedPlatform) {
    return { status: 'unavailable', reason: 'unsupported_platform' };
  }

  if (getRevenueCatApiKey() == null) {
    return { status: 'unavailable', reason: 'missing_api_key' };
  }

  return { status: 'ready' };
}

export function getCurrentRevenueCatAppUserId(): string | null {
  return revenueCatClient.getCurrentAppUserId();
}

export function hasCurrentRevenueCatIdentity(): boolean {
  return revenueCatClient.getCurrentAppUserId() != null;
}

export function isRevenueCatReady(): boolean {
  return revenueCatClient.isReady();
}

export function collectRevenueCatDeviceIdentifiers(): Promise<void> {
  return revenueCatClient.collectDeviceIdentifiers();
}

export function requireCurrentRevenueCatAppUserId(): string {
  return revenueCatClient.requireCurrentAppUserId();
}

export function syncRevenueCatIdentity(
  user: RevenueCatIdentityUser,
): Promise<void> {
  logIdentitySyncDebug('revenuecat.sync_identity_requested', {
    revenuecat_target_app_user_id: user.id,
    revenuecat_target_email: user.email ?? null,
    revenuecat_current_app_user_id: revenueCatClient.getCurrentAppUserId(),
    revenuecat_ready: revenueCatClient.isReady(),
  });
  return revenueCatClient.syncIdentity(user);
}

export function clearRevenueCatIdentity(): Promise<void> {
  logIdentitySyncDebug('revenuecat.clear_identity_requested', {
    revenuecat_current_app_user_id: revenueCatClient.getCurrentAppUserId(),
    revenuecat_ready: revenueCatClient.isReady(),
  });
  return revenueCatClient.clearIdentity();
}

export function getRevenueCatCustomerInfo(): Promise<CustomerInfo> {
  return revenueCatClient.getCustomerInfo() as Promise<CustomerInfo>;
}

// Lets the RevenueCat → AppsFlyer integration attribute server-side revenue
// events back to the AppsFlyer install. Requires RC to be configured (identity
// present) — calling setAttributes before configure throws. Returns whether the
// SDK call completed so callers don't cache a failed sync as done.
export async function setRevenueCatAppsFlyerId(appsFlyerId: string): Promise<boolean> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) return false;
  try {
    await Purchases.setAttributes({ $appsflyerId: appsFlyerId });
    return true;
  } catch {
    // Attribution failures may be premature/transient, so report the miss and
    // let the caller retry instead of caching it as synced.
    return false;
  }
}

export interface RevenueCatChannelAttribution {
  mediaSource: string | null;
  campaign: string | null;
  adGroup: string | null;
  ad: string | null;
  keyword: string | null;
}

// Tags the RevenueCat subscriber with its acquisition channel so revenue/LTV
// reports break down by media source/campaign. Requires RC to be configured
// (identity present); best-effort, never throws.
export async function setRevenueCatChannelAttribution(
  attribution: RevenueCatChannelAttribution,
): Promise<void> {
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) return;
  try {
    if (attribution.mediaSource != null) await Purchases.setMediaSource(attribution.mediaSource);
    if (attribution.campaign != null) await Purchases.setCampaign(attribution.campaign);
    if (attribution.adGroup != null) await Purchases.setAdGroup(attribution.adGroup);
    if (attribution.ad != null) await Purchases.setAd(attribution.ad);
    if (attribution.keyword != null) await Purchases.setKeyword(attribution.keyword);
  } catch {
    // attribution metadata only — safe to drop
  }
}

export function getRevenueCatOfferingForPlacement(
  placement: string,
): Promise<PurchasesOffering | null> {
  return revenueCatClient.getOfferingForPlacement(placement) as Promise<PurchasesOffering | null>;
}

export function purchaseRevenueCatPackage(
  revenueCatPackage: PurchasesPackage,
): Promise<CustomerInfo> {
  return revenueCatClient.purchasePackage(revenueCatPackage) as Promise<CustomerInfo>;
}

export function restoreRevenueCatPurchases(): Promise<CustomerInfo> {
  return revenueCatClient.restorePurchases() as Promise<CustomerInfo>;
}

export async function checkRevenueCatTrialEligibility(
  productIdentifiers: string[],
): Promise<Record<string, IntroEligibility>> {
  if (productIdentifiers.length === 0) return {};
  if (!isRevenueCatReady() || !hasCurrentRevenueCatIdentity()) return {};
  return Purchases.checkTrialOrIntroductoryPriceEligibility(productIdentifiers);
}

export { INTRO_ELIGIBILITY_STATUS };
export type { IntroEligibility };
