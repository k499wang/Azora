import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setRevenueCatAppsFlyerId,
  setRevenueCatChannelAttribution,
} from '../subscriptions/revenueCatClient';
import {
  clearAppsFlyerCustomerUserId,
  getAppsFlyerAvailability,
  getAppsFlyerId,
  getLastAppsFlyerChannelAttribution,
  initAppsFlyer,
  setAppsFlyerConversionHandler,
  setAppsFlyerCustomerUserId,
  setAppsFlyerUserEmails,
  waitForAppsFlyerStart,
} from './appsFlyerClient';

// RevenueCat treats $appsflyerId as immutable: once a subscriber has it, the
// backend rejects every later write with "AppsFlyer ID cannot be modified."
// Persist which value we've already pushed per user so resyncs are no-ops.
const SYNCED_APPSFLYER_ID_KEY = 'revenuecat:appsflyer_id_synced';
const APPSFLYER_START_TIMEOUT_MS = 2000;

function syncedKey(userId: string): string {
  return `${SYNCED_APPSFLYER_ID_KEY}:${userId}`;
}

// The keystone: AppsFlyer's Customer User ID is the RevenueCat app user ID, so
// AppsFlyer / RevenueCat / PostHog all join on a single identity. Also pushes
// the AppsFlyer device ID back into RevenueCat so its server-to-server revenue
// postbacks attribute to the same install.
export async function syncAppsFlyerIdentityForUser(
  userId: string,
  email?: string | null,
): Promise<boolean> {
  if (getAppsFlyerAvailability().status !== 'ready') return false;

  // Register before init so the install-conversion callback can tag RevenueCat
  // with the acquisition channel as soon as AppsFlyer attributes the install.
  setAppsFlyerConversionHandler((attribution) => {
    void setRevenueCatChannelAttribution(attribution);
  });

  await initAppsFlyer();
  setAppsFlyerCustomerUserId(userId);
  if (email != null && email.length > 0) {
    setAppsFlyerUserEmails([email]);
  }
  if (__DEV__) {
    console.log(`[appsflyer-diag] cuid set=${userId}`);
  }

  // If conversion data already arrived before RevenueCat was configured, apply
  // the cached channel now that an identity exists.
  const cachedAttribution = getLastAppsFlyerChannelAttribution();
  if (cachedAttribution != null) {
    await setRevenueCatChannelAttribution(cachedAttribution);
  }

  // Since $appsflyerId is immutable in RevenueCat, any persisted marker means
  // the write already landed — skip the UID work entirely. The UID only
  // changes on reinstall, which also clears this storage.
  const alreadySynced = await AsyncStorage.getItem(syncedKey(userId)).catch(() => null);
  if (alreadySynced != null) return true;

  // The native SDK can finish start asynchronously; reading the UID before
  // start races that startup. Wait on the client's own started signal
  // (bounded) rather than polling — the UID may still resolve pre-start on
  // iOS, so read it either way.
  await waitForAppsFlyerStart(APPSFLYER_START_TIMEOUT_MS);
  const appsFlyerId = await getAppsFlyerId();
  if (appsFlyerId == null || appsFlyerId.length === 0) return false;

  // Only persist the marker if the write actually landed; otherwise a premature
  // attempt (RC not yet configured) would be cached as done and never retried,
  // leaving the subscriber permanently without $appsflyerId.
  const didSync = await setRevenueCatAppsFlyerId(appsFlyerId);
  if (!didSync) return false;
  await AsyncStorage.setItem(syncedKey(userId), appsFlyerId).catch(() => {});
  return true;
}

export function clearAppsFlyerIdentity(): void {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  clearAppsFlyerCustomerUserId();
}
