import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { getRevenueCatApiKey, isRevenueCatSupportedPlatform } from './revenueCatConfig';
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
  return revenueCatClient.syncIdentity(user);
}

export function clearRevenueCatIdentity(): Promise<void> {
  return revenueCatClient.clearIdentity();
}
