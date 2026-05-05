import { useAuthStore } from '../../stores/authStore';
import { useRevenueCatIdentityStore } from '../../stores/revenueCatIdentityStore';
import {
  getRevenueCatAvailability,
  getRevenueCatCustomerInfo,
  syncRevenueCatIdentity,
} from './revenueCatClient';

export async function ensureRevenueCatIdentityForCurrentUser(): Promise<boolean> {
  const user = useAuthStore.getState().user;
  const store = useRevenueCatIdentityStore.getState();

  if (user == null) {
    store.setSignedOut();
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
    return true;
  } catch (error) {
    store.setFailed(error, user.id);
    return false;
  }
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
