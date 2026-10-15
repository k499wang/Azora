export interface TrialJob {
  id: string;
  source_event_id: string;
  store: 'APP_STORE' | 'PLAY_STORE';
  app_user_id: string;
  product_id: string;
  original_transaction_id: string;
  due_at: string;
  lease_token: string;
  attempts: number;
  payload: { event?: Record<string, unknown> };
}

export type Attributes = Record<string, { value?: unknown }>;
export interface Subscriber {
  subscriptions?: Record<string, {
    is_sandbox?: boolean;
    period_type?: string;
    store?: string;
    purchase_date?: string;
    expires_date?: string | null;
    unsubscribe_detected_at?: string | null;
    billing_issues_detected_at?: string | null;
    refunded_at?: string | null;
  }>;
  subscriber_attributes?: Attributes;
}

export type Qualification =
  | { status: 'qualified' }
  | { status: 'pending' | 'suppressed'; reason: string };

export function qualifyTrial(job: TrialJob, subscriber: Subscriber, now: number): Qualification {
  const dueAt = Date.parse(job.due_at);
  if (!Number.isFinite(dueAt) || dueAt > now) return { status: 'pending', reason: 'Qualification time not reached' };
  const subscription = subscriber.subscriptions?.[job.product_id];
  if (!subscription) return { status: 'pending', reason: 'Exact trial product missing from RevenueCat' };
  if (subscription.is_sandbox !== false || subscription.store !== job.store.toLowerCase()) {
    return { status: 'suppressed', reason: 'Subscription store or environment does not match' };
  }
  if (subscription.period_type !== 'trial') {
    return { status: 'suppressed', reason: 'Subscription is no longer a trial' };
  }
  if (subscription.unsubscribe_detected_at || subscription.billing_issues_detected_at || subscription.refunded_at) {
    return { status: 'suppressed', reason: 'Trial cancelled, refunded, or has a billing issue' };
  }
  const purchaseTime = Date.parse(subscription.purchase_date ?? '');
  const sourcePurchaseTime = job.payload.event?.purchased_at_ms;
  if (!Number.isFinite(purchaseTime) || typeof sourcePurchaseTime !== 'number' || !Number.isFinite(sourcePurchaseTime)
    || Math.abs(purchaseTime - sourcePurchaseTime) > 1000) {
    return { status: 'suppressed', reason: 'Current subscription is not the queued trial purchase' };
  }
  const expiresAt = Date.parse(subscription.expires_date ?? '');
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return { status: 'suppressed', reason: 'Trial is expired or has no valid expiration' };
  }
  // Secret-key responses include the live attributes; never restore stale consent from a webhook.
  if (!subscriber.subscriber_attributes || typeof subscriber.subscriber_attributes !== 'object'
    || Array.isArray(subscriber.subscriber_attributes)) {
    return { status: 'pending', reason: 'Live subscriber attributes missing; check RevenueCat secret key' };
  }
  return { status: 'qualified' };
}

function attribute(attributes: Attributes | undefined, key: string): string | undefined {
  const value = attributes?.[key]?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function deviceId(value: string | undefined): string | undefined {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    && !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(value) ? value : undefined;
}

function sharingFilter(rawValue: unknown): string | string[] | undefined {
  if (rawValue === undefined || rawValue === null || rawValue === '') return undefined;
  if (typeof rawValue !== 'string') return 'all';
  const value = rawValue.trim();
  if (!value) return undefined;
  if (value === 'all') return 'all';
  let partners: unknown;
  try { partners = JSON.parse(value); } catch {
    if (value.startsWith('[') || value.startsWith('{')) return 'all';
    partners = value.split(',').map((part) => part.trim());
  }
  // An invalid privacy filter must not silently become unrestricted sharing.
  if (!Array.isArray(partners) || partners.length > 50
    || partners.some((part) => typeof part !== 'string' || !part.trim())) return 'all';
  return partners.length ? partners : undefined;
}

export interface AppsFlyerTrialEvent {
  appsflyer_id: string;
  customer_user_id: string;
  eventName: 'qualified_trial';
  eventValue: string;
  eventTime: string;
  bundleIdentifier: string;
  ip?: string;
  att?: number;
  idfa?: string;
  idfv?: string;
  advertising_id?: string;
  sharing_filter?: string | string[];
}

export function buildQualifiedTrialEvent(job: TrialJob, subscriber: Subscriber): AppsFlyerTrialEvent {
  const attributes = subscriber.subscriber_attributes;
  const webhookAttributes = job.payload.event?.subscriber_attributes as Attributes | undefined;
  const appsFlyerId = attribute(attributes, '$appsflyerId') ?? attribute(webhookAttributes, '$appsflyerId');
  if (!appsFlyerId || !/^\d{13}-\d+$/.test(appsFlyerId)) throw new Error('Missing or invalid AppsFlyer ID');

  const event: AppsFlyerTrialEvent = {
    appsflyer_id: appsFlyerId,
    customer_user_id: job.app_user_id,
    eventName: 'qualified_trial',
    bundleIdentifier: 'com.azora.breath',
    eventValue: JSON.stringify({
      af_content_id: job.product_id,
      original_transaction_id: job.original_transaction_id,
      qualification_minutes: 10,
      revenuecat_event_id: job.source_event_id,
    }),
    eventTime: new Date(job.due_at).toISOString().replace('T', ' ').replace('Z', ''),
  };
  const filter = sharingFilter(attributes?.$appsflyerSharingFilter?.value);
  if (filter !== undefined) event.sharing_filter = filter;
  const ip = attribute(attributes, '$ip');
  if (ip && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)
    && ip.split('.').every((part) => Number(part) <= 255)) event.ip = ip;

  if (job.store === 'APP_STORE') {
    const consent = attribute(attributes, '$attConsentStatus');
    event.att = consent === 'authorized' ? 3 : consent === 'denied' ? 2 : consent === 'restricted' ? 1 : 0;
    const idfa = event.att === 3 ? deviceId(attribute(attributes, '$idfa')) : undefined;
    const idfv = deviceId(attribute(attributes, '$idfv'));
    if (idfa) event.idfa = idfa;
    if (idfv) event.idfv = idfv;
  } else {
    const advertisingId = deviceId(attribute(attributes, '$gpsAdId'));
    if (advertisingId) event.advertising_id = advertisingId;
  }
  if (new TextEncoder().encode(JSON.stringify(event)).length > 1024) {
    throw new Error('AppsFlyer event exceeds 1 KB payload limit');
  }
  return event;
}
