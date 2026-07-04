import { Platform } from 'react-native';
import appsFlyer, { type ConversionData } from 'react-native-appsflyer';
import {
  getAppsFlyerAppId,
  getAppsFlyerDevKey,
  isAppsFlyerSupportedPlatform,
} from './appsFlyerConfig';
import { isAttPermissionResolved } from './attPrompt';

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
let sdkStarted = false;

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

export function initAppsFlyer(): Promise<void> {
  if (initPromise != null) return initPromise;

  if (getAppsFlyerAvailability().status !== 'ready') {
    initPromise = Promise.resolve();
    return initPromise;
  }

  // Never start the SDK while ATT is still undetermined: the install postback
  // and any queued events would go out without a valid Advertiser Tracking
  // Enabled flag, which Meta rejects ("ATE parameter out of range"). Re-arm so
  // the init call made after the prompt resolves actually starts the SDK.
  initPromise = isAttPermissionResolved().then((isResolved) => {
    if (!isResolved) {
      initPromise = null;
      return;
    }
    return startAppsFlyerSdk();
  });
  return initPromise;
}

function startAppsFlyerSdk(): Promise<void> {
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

  return appsFlyer
    .initSdk({
      devKey: getAppsFlyerDevKey() as string,
      appId: Platform.OS === 'ios' ? (resolveIosAppId() ?? undefined) : undefined,
      isDebug: __DEV__,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      // Safety net only: init is gated on ATT being resolved, so the SDK never
      // actually waits. Short in dev so a regression doesn't stall testing.
      timeToWaitForATTUserAuthorization: Platform.OS === 'ios' ? (__DEV__ ? 10 : 60) : undefined,
    })
    .then(() => {
      sdkStarted = true;
    })
    .catch(() => {
      // Re-arm so a later call can retry rather than caching a failed init.
      initPromise = null;
    });
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
  if (getAppsFlyerAvailability().status !== 'ready') return;
  await initAppsFlyer();
  // If ATT is still undetermined the SDK never started; dropping the event is
  // deliberate — it would reach Meta with an invalid ATE flag anyway.
  if (!sdkStarted) return;
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
