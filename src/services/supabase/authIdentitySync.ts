import {
  onUserSignedIn as identifyPostHogUser,
  onUserSignedOut as resetPostHogUser,
} from '../analytics/identity';
import {
  clearRevenueCatIdentity as clearRevenueCatIdentityState,
  syncRevenueCatIdentity as syncRevenueCatUser,
} from '../subscriptions/revenueCatClient';
import { ensureUserProfile } from '../profile/profileBootstrapService';
import { getSupabaseClient } from './client';
import {
  registerAuthIdentitySync as registerAuthIdentitySyncCore,
  type AuthIdentitySyncDependencies,
} from './authIdentitySyncCore';

const defaultDependencies: AuthIdentitySyncDependencies = {
  clearRevenueCatIdentity: clearRevenueCatIdentityState,
  ensureProfile: ensureUserProfile,
  getSupabaseClient,
  onUserSignedIn: identifyPostHogUser,
  onUserSignedOut: resetPostHogUser,
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
