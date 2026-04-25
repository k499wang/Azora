import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { getRevenueCatApiKey, isRevenueCatSupportedPlatform } from './revenueCatConfig';

export interface RevenueCatIdentityUser {
  id: string;
  email?: string | null;
}

let currentAppUserId: string | null = null;
let serialTask: Promise<void> = Promise.resolve();

function runSerial(task: () => Promise<void>): Promise<void> {
  serialTask = serialTask.then(task, task);
  return serialTask;
}

async function ensureConfigured(appUserId: string): Promise<void> {
  const apiKey = getRevenueCatApiKey();
  if (!isRevenueCatSupportedPlatform || apiKey == null) {
    return;
  }

  await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);

  const isConfigured = await Purchases.isConfigured();
  if (!isConfigured) {
    Purchases.configure({
      apiKey,
      appUserID: appUserId,
    });
    currentAppUserId = appUserId;
    return;
  }

  if (currentAppUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    currentAppUserId = appUserId;
  }
}

export function getCurrentRevenueCatAppUserId(): string | null {
  return currentAppUserId;
}

export function isRevenueCatReady(): boolean {
  return isRevenueCatSupportedPlatform && getRevenueCatApiKey() != null;
}

export function syncRevenueCatIdentity(
  user: RevenueCatIdentityUser,
): Promise<void> {
  return runSerial(async () => {
    if (!isRevenueCatReady()) {
      currentAppUserId = user.id;
      return;
    }

    await ensureConfigured(user.id);
    await Purchases.setEmail(user.email ?? null);
    await Purchases.getCustomerInfo();
  });
}

export function clearRevenueCatIdentity(): Promise<void> {
  return runSerial(async () => {
    currentAppUserId = null;
  });
}
