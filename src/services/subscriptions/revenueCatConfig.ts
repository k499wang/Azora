import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExpoExtra = {
  revenueCatIosApiKey?: string;
  revenueCatAndroidApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const revenueCatConfig = {
  iosApiKey: extra.revenueCatIosApiKey ?? null,
  androidApiKey: extra.revenueCatAndroidApiKey ?? null,
};

export const isRevenueCatSupportedPlatform =
  Platform.OS === 'ios' || Platform.OS === 'android';

export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return revenueCatConfig.iosApiKey;
  }

  if (Platform.OS === 'android') {
    return revenueCatConfig.androidApiKey;
  }

  return null;
}

