import { useAuthStore } from '../../stores/authStore';
import { useRevenueCatIdentityStore } from '../../stores/revenueCatIdentityStore';
import {
  getCurrentRevenueCatAppUserId,
  getRevenueCatAvailability,
  isRevenueCatReady,
} from '../subscriptions/revenueCatClient';

export function getRevenueCatDebugSnapshot() {
  const auth = useAuthStore.getState();
  const revenueCatIdentity = useRevenueCatIdentityStore.getState();
  const availability = getRevenueCatAvailability();

  return {
    auth_status: auth.status,
    supabase_user_id: auth.user?.id ?? null,
    revenuecat_status: revenueCatIdentity.status,
    revenuecat_store_app_user_id: revenueCatIdentity.appUserId,
    revenuecat_current_app_user_id: getCurrentRevenueCatAppUserId(),
    revenuecat_ready: isRevenueCatReady(),
    revenuecat_availability: availability.status,
    revenuecat_unavailable_reason:
      availability.status === 'unavailable' ? availability.reason : null,
    revenuecat_last_error: revenueCatIdentity.lastErrorMessage,
    revenuecat_last_synced_at: revenueCatIdentity.lastSyncedAt,
  };
}

export function logRevenueCatPaywallOfferingSnapshot(
  label: string,
  payload: {
    placement: string;
    offeringIdentifier: string | null;
    packages: Array<{
      id: string;
      productIdentifier: string;
      packageIdentifier: string;
      hasIntroOffer: boolean;
      introOfferLabel: string | null;
    }>;
  },
): void {
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) {
    return;
  }

  console.log(`[revenuecat-debug] ${label}`, {
    timestamp: new Date().toISOString(),
    ...getRevenueCatDebugSnapshot(),
    ...payload,
  });
}

export function logRevenueCatDebugSnapshot(label: string): void {
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) {
    return;
  }

  console.log(`[revenuecat-debug] ${label}`, getRevenueCatDebugSnapshot());
}
