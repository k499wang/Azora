import {
  getCurrentPostHogDistinctId,
  onUserSignedIn as identifyPostHogUser,
  onUserSignedOut as resetPostHogUser,
} from '../analytics/identity';
import { clearAppsFlyerIdentity } from '../attribution/appsFlyerIdentitySync';
import {
  clearRevenueCatIdentity as clearRevenueCatIdentityState,
  getCurrentRevenueCatAppUserId,
  getRevenueCatAvailability,
  isRevenueCatReady,
  syncRevenueCatIdentity as syncRevenueCatUser,
} from '../subscriptions/revenueCatClient';
import { useRevenueCatIdentityStore } from '../../stores/revenueCatIdentityStore';
import { ensureUserProfile } from '../profile/profileBootstrapService';
import { getSupabaseClient } from './client';
import {
  registerAuthIdentitySync as registerAuthIdentitySyncCore,
  type AuthIdentitySyncDependencies,
} from './authIdentitySyncCore';

const defaultDependencies: AuthIdentitySyncDependencies = {
  clearAppsFlyerIdentity,
  clearRevenueCatIdentity: clearRevenueCatIdentityState,
  ensureProfile: ensureUserProfile,
  getSupabaseClient,
  getRevenueCatAvailability,
  getPostHogDistinctId: getCurrentPostHogDistinctId,
  getRevenueCatAppUserId: getCurrentRevenueCatAppUserId,
  onRevenueCatSyncFailed: (error, userId) => {
    useRevenueCatIdentityStore.getState().setFailed(error, userId);
  },
  onRevenueCatSyncStarted: (userId) => {
    useRevenueCatIdentityStore.getState().setSyncing(userId);
  },
  onRevenueCatSyncSucceeded: (userId) => {
    useRevenueCatIdentityStore.getState().setSynced(userId);
  },
  onRevenueCatSyncUnavailable: (reason) => {
    useRevenueCatIdentityStore.getState().setUnavailable(reason);
  },
  onRevenueCatSignedOut: () => {
    useRevenueCatIdentityStore.getState().setSignedOut();
  },
  onUserSignedIn: identifyPostHogUser,
  onUserSignedOut: resetPostHogUser,
  isRevenueCatReady,
  syncRevenueCatIdentity: syncRevenueCatUser,
  warn: (message, error) => {
    console.warn(message, error);
  },
};

export function registerAuthIdentitySync(
  dependencies: AuthIdentitySyncDependencies = defaultDependencies,
): () => void {
  return registerAuthIdentitySyncCore(dependencies);
}
