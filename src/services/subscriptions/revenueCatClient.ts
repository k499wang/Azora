import Purchases, { LOG_LEVEL } from 'react-native-purchases';
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
    configure: Purchases.configure,
    getCustomerInfo: Purchases.getCustomerInfo,
    isConfigured: Purchases.isConfigured,
    logIn: async (appUserId) => {
      await Purchases.logIn(appUserId);
    },
    setEmail: Purchases.setEmail,
    setLogLevel: async (level) => {
      await Purchases.setLogLevel(level as LOG_LEVEL);
    },
  },
});

export { RevenueCatSignedOutError, type RevenueCatIdentityUser };

export function getCurrentRevenueCatAppUserId(): string | null {
  return revenueCatClient.getCurrentAppUserId();
}

export function isRevenueCatReady(): boolean {
  return revenueCatClient.isReady();
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
