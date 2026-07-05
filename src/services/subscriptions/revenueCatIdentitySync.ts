import { useAuthStore } from '../../stores/authStore';
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
  setRevenueCatAttConsentStatus,
  syncRevenueCatSubscriberAttributes,
  syncRevenueCatIdentity,
} from './revenueCatClient';

interface EnsureRevenueCatIdentityOptions {
  syncAppsFlyer?: boolean;
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

  store.setSyncing(user.id);

  try {
    await syncRevenueCatIdentity({
      id: user.id,
      email: user.email ?? null,
    });
    store.setSynced(user.id);
    if (shouldSyncAppsFlyer) {
      void getAttPermissionResolution().then((resolution) => {
        if (resolution === 'undetermined') return;
        void syncAppsFlyerIdentityForUser(user.id, user.email ?? null);
      });
    }
    return true;
  } catch (error) {
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
  const didSyncAppsFlyer = await syncAppsFlyerIdentityForUser(
    user.id,
    user.email ?? null,
  ).catch(() => false);
  if (!didSyncRevenueCat) return false;

  const attStatus = await getRevenueCatAttConsentStatus();
  const didSyncAttConsent = await setRevenueCatAttConsentStatus(attStatus);
  await collectRevenueCatDeviceIdentifiers();
  const didSyncAttributes = await syncRevenueCatSubscriberAttributes();

  return didSyncAttConsent && didSyncAttributes && didSyncAppsFlyer;
}

export async function refreshRevenueCatCustomerInfoForCurrentUser(): Promise<boolean> {
  const synced = await ensureRevenueCatIdentityForCurrentUser();
  if (!synced) {
    return false;
  }

  try {
    await getRevenueCatCustomerInfo();
    return true;
  } catch (error) {
    useRevenueCatIdentityStore
      .getState()
      .setFailed(error, useAuthStore.getState().user?.id ?? null);
    return false;
  }
}
