import { useAuthStore } from '../../stores/authStore';
import type { CustomerInfo } from 'react-native-purchases';
import { useRevenueCatIdentityStore } from '../../stores/revenueCatIdentityStore';
import {
  clearAppsFlyerIdentity,
  syncAppsFlyerIdentityForUser,
} from '../attribution/appsFlyerIdentitySync';
import {
  getAttPermissionResolution,
  getRevenueCatAttConsentStatus,
} from '../attribution/attPrompt';
import {
  collectRevenueCatDeviceIdentifiers,
  getRevenueCatAvailability,
  getRevenueCatCustomerInfo,
  getCurrentRevenueCatAppUserId,
  setRevenueCatAttConsentStatus,
  syncRevenueCatSubscriberAttributes,
  syncRevenueCatIdentity,
} from './revenueCatClient';

interface EnsureRevenueCatIdentityOptions {
  syncAppsFlyer?: boolean;
  forceSync?: boolean;
}

export async function ensureRevenueCatIdentityForCurrentUser(
  options: EnsureRevenueCatIdentityOptions = {},
): Promise<boolean> {
  const shouldSyncAppsFlyer = options.syncAppsFlyer ?? true;
  const user = useAuthStore.getState().user;
  const store = useRevenueCatIdentityStore.getState();

  if (user == null) {
    store.setSignedOut();
    clearAppsFlyerIdentity();
    return false;
  }

  const availability = getRevenueCatAvailability();
  if (availability.status === 'unavailable') {
    store.setUnavailable(availability.reason);
    return false;
  }

  if (!options.forceSync && store.status === 'synced' && store.appUserId === user.id &&
      getCurrentRevenueCatAppUserId() === user.id) {
    return true;
  }

  store.setSyncing(user.id);

  try {
    await syncRevenueCatIdentity({
      id: user.id,
      email: user.email ?? null,
    });
    if (useAuthStore.getState().user?.id !== user.id) return false;
    store.setSynced(user.id);
    if (shouldSyncAppsFlyer) {
      void getAttPermissionResolution().then((resolution) => {
        if (resolution === 'undetermined') return;
        void syncAppsFlyerIdentityForUser(user.id, user.email ?? null);
      });
    }
    return true;
  } catch (error) {
    if (useAuthStore.getState().user?.id !== user.id) return false;
    store.setFailed(error, user.id);
    return false;
  }
}

export async function syncRevenueCatAttributionForCurrentUser(): Promise<boolean> {
  const user = useAuthStore.getState().user;
  if (user == null) {
    useRevenueCatIdentityStore.getState().setSignedOut();
    clearAppsFlyerIdentity();
    return false;
  }

  const didSyncRevenueCat = await ensureRevenueCatIdentityForCurrentUser({
    syncAppsFlyer: false,
  });
  if (!didSyncRevenueCat) return false;
  const didSyncAppsFlyer = await syncAppsFlyerIdentityForUser(
    user.id,
    user.email ?? null,
  ).catch(() => false);

  const attStatus = await getRevenueCatAttConsentStatus();
  const didSyncAttConsent = await setRevenueCatAttConsentStatus(attStatus);
  await collectRevenueCatDeviceIdentifiers();
  const didSyncAttributes = await syncRevenueCatSubscriberAttributes();

  return didSyncAttConsent && didSyncAttributes && didSyncAppsFlyer;
}

export async function refreshRevenueCatCustomerInfoForCurrentUser(): Promise<CustomerInfo | null> {
  const userId = useAuthStore.getState().user?.id;
  if (userId == null) return null;
  const synced = await ensureRevenueCatIdentityForCurrentUser();
  if (!synced || useAuthStore.getState().user?.id !== userId) {
    return null;
  }

  try {
    const customerInfo = await getRevenueCatCustomerInfo();
    if (useAuthStore.getState().user?.id !== userId ||
        getCurrentRevenueCatAppUserId() !== userId) return null;
    return customerInfo;
  } catch (error) {
    if (useAuthStore.getState().user?.id !== userId) return null;
    useRevenueCatIdentityStore
      .getState()
      .setFailed(error, userId);
    return null;
  }
}
