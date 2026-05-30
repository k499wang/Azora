import { Platform } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import {
  getAppsFlyerAppId,
  getAppsFlyerDevKey,
  isAppsFlyerSupportedPlatform,
} from './appsFlyerConfig';

export type AppsFlyerAvailability =
  | { status: 'ready' }
  | { status: 'unavailable'; reason: 'unsupported_platform' | 'missing_dev_key' };

export type AppsFlyerDeepLink = {
  deepLinkValue: string | null;
  isDeferred: boolean;
  mediaSource: string | null;
  campaign: string | null;
  raw: Record<string, unknown>;
};

export type AppsFlyerDeepLinkHandler = (link: AppsFlyerDeepLink) => void;

// AppsFlyer's iOS SDK wants the bare numeric Apple ID; our config stores the
// App Store form ("id6763631574"). Android takes no appId at all.
function resolveIosAppId(): string | null {
  const appId = getAppsFlyerAppId();
  if (appId == null) return null;
  return appId.replace(/^id/i, '');
}

export function getAppsFlyerAvailability(): AppsFlyerAvailability {
  if (!isAppsFlyerSupportedPlatform) {
    return { status: 'unavailable', reason: 'unsupported_platform' };
  }
  if (getAppsFlyerDevKey() == null) {
    return { status: 'unavailable', reason: 'missing_dev_key' };
  }
  return { status: 'ready' };
}

let deepLinkHandler: AppsFlyerDeepLinkHandler | null = null;
let initPromise: Promise<void> | null = null;

// Settable before init so the listener (which must register *before* initSdk)
// can forward to whatever the app wires up later.
export function setAppsFlyerDeepLinkHandler(handler: AppsFlyerDeepLinkHandler): void {
  deepLinkHandler = handler;
}

export function initAppsFlyer(): Promise<void> {
  if (initPromise != null) return initPromise;

  if (getAppsFlyerAvailability().status !== 'ready') {
    initPromise = Promise.resolve();
    return initPromise;
  }

  // Listeners must register BEFORE initSdk or the first callback is lost.
  appsFlyer.onDeepLink((result) => {
    if (deepLinkHandler == null) return;
    const data = result?.data ?? {};
    deepLinkHandler({
      deepLinkValue: data.deep_link_value ?? null,
      isDeferred: Boolean(result?.isDeferred),
      mediaSource: data.media_source ?? null,
      campaign: data.campaign ?? null,
      raw: data as Record<string, unknown>,
    });
  });

  // These fire once AppsFlyer's servers respond to the install postback, so a
  // log here is proof the device actually reached AppsFlyer (vs. just minting a
  // local UID). Silence in both = the install never landed.
  if (__DEV__) {
    appsFlyer.onInstallConversionData((data) => {
      console.log('[appsflyer-diag] install conversion OK:', JSON.stringify(data));
    });
    appsFlyer.onInstallConversionFailure((error) => {
      console.log('[appsflyer-diag] install conversion FAILED:', JSON.stringify(error));
    });
  }

  initPromise = appsFlyer
    .initSdk({
      devKey: getAppsFlyerDevKey() as string,
      appId: Platform.OS === 'ios' ? (resolveIosAppId() ?? undefined) : undefined,
      isDebug: __DEV__,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      // iOS only: hold the install postback until ATT is resolved (or timeout).
      // Short in dev so testing doesn't stall a full minute per launch.
      timeToWaitForATTUserAuthorization: Platform.OS === 'ios' ? (__DEV__ ? 10 : 60) : undefined,
    })
    .then(() => undefined)
    .catch(() => {
      // Re-arm so a later call can retry rather than caching a failed init.
      initPromise = null;
    });

  return initPromise;
}

export function setAppsFlyerCustomerUserId(id: string): void {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  appsFlyer.setCustomerUserId(id);
}

export function clearAppsFlyerCustomerUserId(): void {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  appsFlyer.setCustomerUserId('');
}

export async function logAppsFlyerEvent(
  eventName: string,
  eventValues: Record<string, unknown> = {},
): Promise<void> {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  await initAppsFlyer();
  try {
    // Promise form (no callbacks) — the callback form silently drops the
    // result on Android due to the SDK's WeakReference CallbackGuard.
    await appsFlyer.logEvent(eventName, eventValues);
  } catch {
    // Attribution events are best-effort; never surface to the user.
  }
}

export function getAppsFlyerId(): Promise<string | null> {
  if (getAppsFlyerAvailability().status !== 'ready') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    appsFlyer.getAppsFlyerUID((error, uid) => {
      resolve(error != null || uid == null ? null : uid);
    });
  });
}
