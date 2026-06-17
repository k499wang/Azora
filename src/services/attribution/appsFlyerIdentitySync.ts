import AsyncStorage from '@react-native-async-storage/async-storage';
import { setRevenueCatAppsFlyerId } from '../subscriptions/revenueCatClient';
import {
  clearAppsFlyerCustomerUserId,
  getAppsFlyerAvailability,
  getAppsFlyerId,
  initAppsFlyer,
  setAppsFlyerCustomerUserId,
  setAppsFlyerUserEmails,
} from './appsFlyerClient';

// RevenueCat treats $appsflyerId as immutable: once a subscriber has it, the
// backend rejects every later write with "AppsFlyer ID cannot be modified."
// Persist which value we've already pushed per user so resyncs are no-ops.
const SYNCED_APPSFLYER_ID_KEY = 'revenuecat:appsflyer_id_synced';

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
): Promise<void> {
  if (getAppsFlyerAvailability().status !== 'ready') return;

  await initAppsFlyer();
  setAppsFlyerCustomerUserId(userId);
  if (email != null && email.length > 0) {
    setAppsFlyerUserEmails([email]);
  }
  if (__DEV__) {
    console.log(`[appsflyer-diag] cuid set=${userId}`);
  }

  const appsFlyerId = await getAppsFlyerId();
  if (appsFlyerId == null) return;

  const alreadySynced = await AsyncStorage.getItem(syncedKey(userId)).catch(() => null);
  if (alreadySynced === appsFlyerId) return;

  await setRevenueCatAppsFlyerId(appsFlyerId);
  await AsyncStorage.setItem(syncedKey(userId), appsFlyerId).catch(() => {});
}

export function clearAppsFlyerIdentity(): void {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  clearAppsFlyerCustomerUserId();
}
