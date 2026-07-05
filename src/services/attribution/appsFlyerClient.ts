import { AppState, Platform, type AppStateStatus } from 'react-native';
import appsFlyer, { type ConversionData } from 'react-native-appsflyer';
import {
  getAppsFlyerAppId,
  getAppsFlyerDevKey,
  isAppsFlyerSupportedPlatform,
} from './appsFlyerConfig';
import {
  getAttPermissionResolution,
  type AttPermissionResolution,
} from './attPrompt';

// Acquisition channel for an install, mapped onto RevenueCat's reserved
// attribution attributes so revenue can be sliced by source/campaign.
export interface AppsFlyerChannelAttribution {
  mediaSource: string | null;
  campaign: string | null;
  adGroup: string | null;
  ad: string | null;
  keyword: string | null;
}

export type AppsFlyerConversionHandler = (
  attribution: AppsFlyerChannelAttribution,
) => void;

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
let conversionHandler: AppsFlyerConversionHandler | null = null;
let lastChannelAttribution: AppsFlyerChannelAttribution | null = null;
let initPromise: Promise<void> | null = null;
let sdkInitialized = false;
let sdkStarted = false;
let listenersRegistered = false;
let attRetrySubscription: { remove: () => void } | null = null;
let attRetryTimeout: ReturnType<typeof setTimeout> | null = null;

// Settable before init so the listener (which must register *before* initSdk)
// can forward to whatever the app wires up later.
export function setAppsFlyerDeepLinkHandler(handler: AppsFlyerDeepLinkHandler): void {
  deepLinkHandler = handler;
}

export function setAppsFlyerConversionHandler(handler: AppsFlyerConversionHandler): void {
  conversionHandler = handler;
}

// Install conversion data arrives once, async, shortly after first launch. We
// cache it so a consumer that wires up (or a RevenueCat identity that
// configures) *after* the callback fired can still apply it.
export function getLastAppsFlyerChannelAttribution(): AppsFlyerChannelAttribution | null {
  return lastChannelAttribution;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function parseConversionAttribution(
  result: ConversionData,
): AppsFlyerChannelAttribution | null {
  if (result?.status !== 'success') return null;

  // Android can hand back the payload as a JSON string; iOS sends an object.
  const raw: unknown = result.data;
  let data: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else {
    data = (raw ?? {}) as Record<string, unknown>;
  }

  const isOrganic = data.af_status === 'Organic';
  return {
    mediaSource: isOrganic ? 'organic' : asString(data.media_source),
    campaign: asString(data.campaign),
    adGroup: asString(data.af_adset ?? data.adset),
    ad: asString(data.af_ad),
    keyword: asString(data.af_keywords),
  };
}

export async function initAppsFlyer(): Promise<void> {
  if (getAppsFlyerAvailability().status !== 'ready') {
    return;
  }

  await initializeAppsFlyerSdk();
  if (!sdkInitialized) return;
  await startAppsFlyerSdkIfReady();
}

function registerAppsFlyerListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

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
  appsFlyer.onInstallConversionData((result) => {
    if (__DEV__) {
      console.log('[appsflyer-diag] install conversion OK:', JSON.stringify(result));
    }
    const attribution = parseConversionAttribution(result);
    if (attribution == null) return;
    lastChannelAttribution = attribution;
    conversionHandler?.(attribution);
  });
  appsFlyer.onInstallConversionFailure((error) => {
    if (__DEV__) {
      console.log('[appsflyer-diag] install conversion FAILED:', JSON.stringify(error));
    }
  });
}

function initializeAppsFlyerSdk(): Promise<void> {
  if (sdkInitialized) return Promise.resolve();
  if (initPromise != null) return initPromise;

  registerAppsFlyerListeners();

  // On iOS, initialize early but use manual start until ATT is resolved. That
  // gives AppsFlyer its listeners/config at launch without sending Meta-bound
  // install/session payloads while Advertiser Tracking Enabled is unavailable.
  initPromise = appsFlyer
    .initSdk({
      devKey: getAppsFlyerDevKey() as string,
      appId: Platform.OS === 'ios' ? (resolveIosAppId() ?? undefined) : undefined,
      isDebug: __DEV__,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      manualStart: Platform.OS === 'ios',
      timeToWaitForATTUserAuthorization: Platform.OS === 'ios' ? (__DEV__ ? 10 : 60) : undefined,
    })
    .then(() => {
      sdkInitialized = true;
      sdkStarted = Platform.OS !== 'ios';
    })
    .catch(() => {
      // Re-arm so a later call can retry rather than caching a failed init.
      initPromise = null;
      sdkInitialized = false;
    });
  return initPromise;
}

async function startAppsFlyerSdkIfReady(): Promise<void> {
  if (sdkStarted) return;

  if (Platform.OS === 'ios') {
    const resolution = await getAttPermissionResolution();
    if (sdkStarted) return;
    if (resolution !== 'resolved') {
      scheduleAppsFlyerStartRetry(resolution);
      return;
    }
  }

  try {
    appsFlyer.startSdk();
    sdkStarted = true;
    clearAppsFlyerStartRetry();
  } catch {
    // Attribution is best-effort. Keep sdkStarted false so a later call retries.
  }
}

function scheduleAppsFlyerStartRetry(reason: Exclude<AttPermissionResolution, 'resolved'>): void {
  if (Platform.OS !== 'ios' || sdkStarted) return;

  if (attRetrySubscription == null) {
    attRetrySubscription = AppState.addEventListener('change', handleAppsFlyerRetryAppState);
  }

  // Transient permission-service failures can recover while the app remains
  // active. Do one short retry in addition to the app-active retry.
  if (reason === 'error' && attRetryTimeout == null) {
    attRetryTimeout = setTimeout(() => {
      attRetryTimeout = null;
      void initAppsFlyer();
    }, 1500);
  }
}

function handleAppsFlyerRetryAppState(nextState: AppStateStatus): void {
  if (nextState !== 'active') return;
  clearAppsFlyerStartRetry();
  void initAppsFlyer();
}

function clearAppsFlyerStartRetry(): void {
  attRetrySubscription?.remove();
  attRetrySubscription = null;
  if (attRetryTimeout != null) {
    clearTimeout(attRetryTimeout);
    attRetryTimeout = null;
  }
}

export function setAppsFlyerCustomerUserId(id: string): void {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  appsFlyer.setCustomerUserId(id);
}

// AppsFlyer's native EmailCryptType is NONE=0, SHA1=1, MD5=2, SHA256=3. The
// bundled TS enum auto-numbers SHA256 as 1 (i.e. SHA1), so we pass the raw
// native value — SHA256 is what Meta's advanced matching expects, and it lets
// partners match installs by person when IDFA is unavailable (ATT denied).
const APPSFLYER_EMAIL_CRYPT_SHA256 = 3;

// Normalize before handing off so the SHA256 the SDK produces matches the
// canonical form ad partners hash against (trimmed, lowercased).
export function setAppsFlyerUserEmails(emails: string[]): void {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  const normalized = emails
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
  if (normalized.length === 0) return;
  appsFlyer.setUserEmails(
    { emails: normalized, emailsCryptType: APPSFLYER_EMAIL_CRYPT_SHA256 },
    () => {},
    () => {},
  );
}

export function clearAppsFlyerCustomerUserId(): void {
  if (getAppsFlyerAvailability().status !== 'ready') return;
  appsFlyer.setCustomerUserId('');
}

export async function logAppsFlyerEvent(
  eventName: string,
  eventValues: Record<string, unknown> = {},
): Promise<void> {
  const availability = getAppsFlyerAvailability();
  if (__DEV__) {
    logAppsFlyerEventDiagnostic('event requested', {
      eventName,
      eventValues,
      availability: availability.status,
      sdkInitialized,
      sdkStarted,
      platform: Platform.OS,
    });
  }

  if (availability.status !== 'ready') {
    if (__DEV__) {
      logAppsFlyerEventDiagnostic('event dropped', {
        eventName,
        reason: availability.reason,
      });
    }
    return;
  }

  await initAppsFlyer();
  // If ATT is still undetermined the SDK remains in manual-start mode; dropping
  // the event is deliberate because Meta would reject the missing ATE state.
  if (!sdkStarted) {
    if (__DEV__) {
      logAppsFlyerEventDiagnostic('event dropped', {
        eventName,
        reason: 'sdk_not_started',
        sdkInitialized,
        sdkStarted,
        platform: Platform.OS,
      });
    }
    return;
  }

  try {
    // Promise form (no callbacks) — the callback form silently drops the
    // result on Android due to the SDK's WeakReference CallbackGuard.
    await appsFlyer.logEvent(eventName, eventValues);
    if (__DEV__) {
      logAppsFlyerEventDiagnostic('event sent', {
        eventName,
        eventValues,
        sdkInitialized,
        sdkStarted,
        platform: Platform.OS,
      });
    }
  } catch (error) {
    if (__DEV__) {
      logAppsFlyerEventDiagnostic('event failed', {
        eventName,
        eventValues,
        error: getErrorMessage(error),
        sdkInitialized,
        sdkStarted,
        platform: Platform.OS,
      });
    }
    // Attribution events are best-effort; never surface to the user.
  }
}

function logAppsFlyerEventDiagnostic(
  label: string,
  payload: Record<string, unknown>,
): void {
  try {
    console.log(`[appsflyer-diag] ${label}:`, JSON.stringify(payload));
  } catch {
    console.log(`[appsflyer-diag] ${label}:`, '[unserializable payload]');
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown AppsFlyer event error';
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
