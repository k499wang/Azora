// RevenueCat web checkout webhook receiver.
//
// This endpoint is separate from `revenuecat-webhook` so mobile purchase
// mirroring can remain unchanged while web checkout events reconcile
// `web_checkout_intents`. It still writes the same `subscriptions` mirror so
// mobile can see Pro access after a web purchase.
//
// Configure in RevenueCat dashboard for web checkout events:
//   - URL:     https://<project>.functions.supabase.co/revenuecat-web-checkout-webhook
//   - Header:  Authorization: Bearer <REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'INVOICE_ISSUANCE'
  | 'SUBSCRIBER_ALIAS'
  | 'TRANSFER'
  | 'TEST';

type PeriodType = 'TRIAL' | 'INTRO' | 'NORMAL' | 'PROMOTIONAL';

interface RevenueCatEvent {
  id: string;
  type: RevenueCatEventType;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  environment: 'SANDBOX' | 'PRODUCTION';
  product_id?: string;
  entitlement_ids?: string[] | null;
  period_type?: PeriodType;
  event_timestamp_ms?: number | null;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  store?: string;
  cancel_reason?: string | null;
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  price?: number | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  presented_offering_id?: string | null;
  presented_offering_identifier?: string | null;
  experiment_id?: string | null;
  experiment_name?: string | null;
  variant_id?: string | null;
  variant_name?: string | null;
  experiment?: {
    id?: string | null;
    name?: string | null;
    variant?: string | null;
    variant_id?: string | null;
    variant_name?: string | null;
  } | null;
}

interface RevenueCatPayload {
  event: RevenueCatEvent;
  api_version?: string;
}

interface SubscriptionMirrorRow {
  current_period_ends_at: string | null;
  last_revenuecat_event_timestamp_ms: number | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
  throw new Error(
    'Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET',
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PRO_ENTITLEMENT = 'Azora  Pro';
const SUBSCRIPTION_WRITING_EVENT_TYPES = new Set<RevenueCatEventType>([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'EXPIRATION',
  'BILLING_ISSUE',
  'PRODUCT_CHANGE',
]);

// RevenueCat fans every project event out to every configured webhook; it can
// only be filtered by environment, app, and event type — not by store. This
// endpoint owns web checkout, so ignore native-store events (the mobile
// `revenuecat-webhook` handles those) to avoid double-mirroring `subscriptions`.
const WEB_STORES = new Set(['RC_BILLING', 'STRIPE']);

function isForeignStoreEvent(event: RevenueCatEvent): boolean {
  return (
    event.type !== 'TEST' &&
    typeof event.store === 'string' &&
    !WEB_STORES.has(event.store)
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function extractInitialAttribution(event: RevenueCatEvent): {
  initial_offering_id: string | null;
  experiment_id: string | null;
  experiment_variant: string | null;
} {
  const offeringId =
    event.presented_offering_id ??
    event.presented_offering_identifier ??
    null;

  const experimentId =
    event.experiment?.id ??
    event.experiment_id ??
    null;

  const experimentVariant =
    event.experiment?.variant ??
    event.experiment?.variant_name ??
    event.experiment?.variant_id ??
    event.variant_name ??
    event.variant_id ??
    null;

  return {
    initial_offering_id: offeringId,
    experiment_id: experimentId,
    experiment_variant: experimentVariant,
  };
}

function deriveStatus(
  event: RevenueCatEvent,
): { status: string; willRenew: boolean | null } {
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
      return {
        status: event.period_type === 'TRIAL' ? 'trialing' : 'active',
        willRenew: true,
      };
    case 'NON_RENEWING_PURCHASE':
      return { status: 'active', willRenew: false };
    case 'CANCELLATION':
      return { status: 'active', willRenew: false };
    case 'BILLING_ISSUE':
      return { status: 'expired', willRenew: false };
    case 'EXPIRATION':
      return { status: 'expired', willRenew: false };
    case 'TRANSFER':
    case 'SUBSCRIBER_ALIAS':
    case 'TEST':
      return { status: 'active', willRenew: null };
    default:
      return { status: 'unknown', willRenew: null };
  }
}

function getEventTimestampMs(event: RevenueCatEvent): number | null {
  return typeof event.event_timestamp_ms === 'number'
    ? event.event_timestamp_ms
    : null;
}

function toIsoString(ms: number | null | undefined): string | null {
  return typeof ms === 'number' ? new Date(ms).toISOString() : null;
}

function isStaleSubscriptionEvent(
  eventTimestampMs: number | null,
  existingTimestampMs: number | null | undefined,
): boolean {
  if (eventTimestampMs == null || existingTimestampMs == null) {
    return false;
  }

  return eventTimestampMs < existingTimestampMs;
}

function getCurrentPeriodEndsAt(
  event: RevenueCatEvent,
  existingSubscription: SubscriptionMirrorRow | null,
): string | null {
  const explicitExpiration = toIsoString(event.expiration_at_ms);
  if (explicitExpiration != null) {
    return explicitExpiration;
  }

  if (event.type === 'CANCELLATION') {
    return existingSubscription?.current_period_ends_at ?? new Date().toISOString();
  }

  if (event.type === 'EXPIRATION') {
    return new Date().toISOString();
  }

  return null;
}

function isSubscriptionWritingEvent(event: RevenueCatEvent): boolean {
  return SUBSCRIPTION_WRITING_EVENT_TYPES.has(event.type);
}

function isPurchaseEvent(event: RevenueCatEvent): boolean {
  return event.type === 'INITIAL_PURCHASE' || event.type === 'NON_RENEWING_PURCHASE';
}

function getPriceAmount(event: RevenueCatEvent): number | null {
  if (typeof event.price_in_purchased_currency === 'number') {
    return event.price_in_purchased_currency;
  }

  if (typeof event.price === 'number') {
    return event.price;
  }

  return null;
}

async function resolveUserId(event: RevenueCatEvent): Promise<string | null> {
  if (!event.app_user_id || !isUuid(event.app_user_id)) {
    return null;
  }

  const { data: profile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', event.app_user_id)
    .maybeSingle();

  if (profileLookupError) {
    throw profileLookupError;
  }

  return profile?.user_id ?? null;
}

async function logRevenueCatEvent(
  payload: RevenueCatPayload,
  userId: string | null,
): Promise<void> {
  const { event } = payload;
  const { error } = await supabase
    .from('revenuecat_events')
    .insert({
      event_id: event.id,
      user_id: userId,
      environment: event.environment,
      event_type: event.type,
      payload,
    });

  if (error && error.code !== '23505') {
    throw error;
  }
}

async function mirrorSubscription(
  event: RevenueCatEvent,
  userId: string,
): Promise<{ mirrored: boolean; stale: boolean }> {
  const { data: existingSubscription, error: subscriptionLookupError } =
    await supabase
      .from('subscriptions')
      .select('current_period_ends_at,last_revenuecat_event_timestamp_ms')
      .eq('user_id', userId)
      .maybeSingle();

  if (subscriptionLookupError) {
    throw subscriptionLookupError;
  }

  const eventTimestampMs = getEventTimestampMs(event);
  const stale = isStaleSubscriptionEvent(
    eventTimestampMs,
    existingSubscription?.last_revenuecat_event_timestamp_ms,
  );

  if (stale) {
    console.warn('stale RevenueCat web event logged but not mirrored', {
      revenuecat_event_id: event.id,
      revenuecat_event_type: event.type,
      revenuecat_event_timestamp_ms: eventTimestampMs,
      last_revenuecat_event_timestamp_ms:
        existingSubscription?.last_revenuecat_event_timestamp_ms ?? null,
    });
    return { mirrored: false, stale: true };
  }

  const { status, willRenew } = deriveStatus(event);
  const currentPeriodEndsAt = getCurrentPeriodEndsAt(event, existingSubscription);
  const trialEndsAt =
    event.period_type === 'TRIAL' && event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

  const row: Record<string, unknown> = {
    user_id: userId,
    revenuecat_app_user_id: event.app_user_id,
    entitlement: event.entitlement_ids?.[0] ?? PRO_ENTITLEMENT,
    status,
    product_id: event.product_id ?? null,
    store: event.store ?? null,
    current_period_ends_at: currentPeriodEndsAt,
    will_renew: willRenew,
    trial_ends_at: trialEndsAt,
    last_revenuecat_event_id: event.id,
    last_revenuecat_event_type: event.type,
    last_revenuecat_event_timestamp_ms: eventTimestampMs,
    last_revenuecat_event_received_at: new Date().toISOString(),
    last_revenuecat_transaction_id: event.transaction_id ?? null,
    last_revenuecat_original_transaction_id: event.original_transaction_id ?? null,
  };

  if (event.type === 'INITIAL_PURCHASE') {
    Object.assign(row, extractInitialAttribution(event));
  }

  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(row, { onConflict: 'user_id' });

  if (upsertError) {
    throw upsertError;
  }

  return { mirrored: true, stale: false };
}

async function reconcileWebCheckoutIntent(
  event: RevenueCatEvent,
  userId: string,
): Promise<{ matched: boolean }> {
  if (!isPurchaseEvent(event)) {
    return { matched: false };
  }

  const { data: intents, error: intentLookupError } = await supabase
    .from('web_checkout_intents')
    .select('id, session_id, revenuecat_product_id')
    .eq('user_id', userId)
    .eq('revenuecat_app_user_id', event.app_user_id ?? '')
    .eq('environment', event.environment)
    .in('status', ['created', 'redirected'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (intentLookupError) {
    throw intentLookupError;
  }

  const intent =
    event.product_id != null
      ? (intents?.find(
            (candidate) =>
              candidate.revenuecat_product_id === event.product_id ||
              candidate.revenuecat_product_id == null,
          ) ?? null)
      : (intents?.[0] ?? null);

  if (!intent) {
    console.warn('no open web_checkout_intent matched RevenueCat web purchase', {
      user_id: userId,
      revenuecat_event_id: event.id,
      revenuecat_product_id: event.product_id ?? null,
    });
    return { matched: false };
  }

  const purchasedAt =
    toIsoString(event.purchased_at_ms) ??
    toIsoString(event.event_timestamp_ms) ??
    new Date().toISOString();

  const { error: intentUpdateError } = await supabase
    .from('web_checkout_intents')
    .update({
      status: 'purchased',
      revenuecat_event_id: event.id,
      revenuecat_product_id: event.product_id ?? null,
      revenuecat_transaction_id: event.transaction_id ?? null,
      revenuecat_original_transaction_id: event.original_transaction_id ?? null,
      purchased_at: purchasedAt,
      price_amount: getPriceAmount(event),
      currency: event.currency ?? null,
      failure_reason: null,
    })
    .eq('id', intent.id);

  if (intentUpdateError) {
    throw intentUpdateError;
  }

  const { error: sessionUpdateError } = await supabase
    .from('web_funnel_sessions')
    .update({ status: 'purchased' })
    .eq('id', intent.session_id);

  if (sessionUpdateError) {
    console.error('web_funnel_sessions purchase status update failed', sessionUpdateError);
  }

  return { matched: true };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${WEBHOOK_SECRET}`;
  if (auth !== expected) {
    return new Response('unauthorized', { status: 401 });
  }

  let payload: RevenueCatPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const event = payload?.event;
  if (!event?.id || !event.type) {
    return new Response('missing event fields', { status: 400 });
  }

  if (isForeignStoreEvent(event)) {
    return new Response(JSON.stringify({ ok: true, ignored: 'non-web store' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (isSubscriptionWritingEvent(event) && !event.app_user_id) {
    return new Response('missing event fields', { status: 400 });
  }

  let userId: string | null;
  try {
    userId = await resolveUserId(event);
  } catch (error) {
    console.error('profiles lookup failed', error);
    return new Response('profile lookup failed', { status: 500 });
  }

  try {
    await logRevenueCatEvent(payload, userId);
  } catch (error) {
    console.error('revenuecat_events insert failed', error);
    return new Response('event log failed', { status: 500 });
  }

  if (!isSubscriptionWritingEvent(event)) {
    return new Response(JSON.stringify({ ok: true, logged: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!userId) {
    console.warn('web checkout app_user_id is not a known Supabase profile', {
      revenuecat_app_user_id: event.app_user_id ?? null,
      revenuecat_event_id: event.id,
    });
    return new Response(JSON.stringify({ ok: true, logged: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  let subscriptionResult: { mirrored: boolean; stale: boolean };
  try {
    subscriptionResult = await mirrorSubscription(event, userId);
  } catch (error) {
    console.error('subscriptions web mirror failed', error);
    return new Response('subscription write failed', { status: 500 });
  }

  let checkoutIntentMatched = false;
  try {
    const checkoutReconciliation = await reconcileWebCheckoutIntent(event, userId);
    checkoutIntentMatched = checkoutReconciliation.matched;
  } catch (error) {
    console.error('web checkout intent reconciliation failed', error);
  }

  return new Response(JSON.stringify({
    ok: true,
    subscription_mirrored: subscriptionResult.mirrored,
    subscription_event_stale: subscriptionResult.stale,
    web_checkout_intent_matched: checkoutIntentMatched,
  }), {
    headers: { 'content-type': 'application/json' },
  });
});
