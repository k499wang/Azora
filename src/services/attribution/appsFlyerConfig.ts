import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExpoExtra = {
  appsFlyerDevKey?: string;
  appsFlyerAppId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const appsFlyerConfig = {
  devKey: extra.appsFlyerDevKey ?? null,
  appId: extra.appsFlyerAppId ?? null,
};

export const isAppsFlyerSupportedPlatform =
  Platform.OS === 'ios' || Platform.OS === 'android';

export function getAppsFlyerDevKey(): string | null {
  return appsFlyerConfig.devKey;
}

export function getAppsFlyerAppId(): string | null {
  return appsFlyerConfig.appId;
}
