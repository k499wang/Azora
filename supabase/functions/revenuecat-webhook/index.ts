// RevenueCat webhook receiver.
//
// Writes every incoming event to `revenuecat_events` (idempotent via event_id
// primary key) and upserts the caller's current subscription state into
// `subscriptions`. Uses the service-role key to bypass RLS.
//
// Configure in RevenueCat dashboard:
//   - URL:     https://<project>.functions.supabase.co/revenuecat-webhook
//   - Header:  Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>

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
  expiration_at_ms?: number | null;
  store?: string;
  cancel_reason?: string | null;
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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
  throw new Error(
    'Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REVENUECAT_WEBHOOK_SECRET',
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
// endpoint owns native-store mirroring, so ignore web checkout events (the
// `revenuecat-web-checkout-webhook` handles those) to avoid double-mirroring.
const WEB_STORES = new Set(['RC_BILLING', 'STRIPE']);

function isWebStoreEvent(event: RevenueCatEvent): boolean {
  return (
    event.type !== 'TEST' &&
    typeof event.store === 'string' &&
    WEB_STORES.has(event.store)
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

function isSubscriptionWritingEvent(event: RevenueCatEvent): boolean {
  return SUBSCRIPTION_WRITING_EVENT_TYPES.has(event.type);
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

  if (isWebStoreEvent(event)) {
    return new Response(JSON.stringify({ ok: true, ignored: 'web store' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  // Audit-only events can be logged without a single app_user_id. Only events
  // that mutate subscription state require a known RevenueCat App User ID.
  if (isSubscriptionWritingEvent(event) && !event.app_user_id) {
    return new Response('missing event fields', { status: 400 });
  }

  let userId: string | null = null;

  if (event.app_user_id && isUuid(event.app_user_id)) {
    const { data: profile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', event.app_user_id)
      .maybeSingle();

    if (profileLookupError) {
      console.error('profiles lookup failed', profileLookupError);
      return new Response('profile lookup failed', { status: 500 });
    }

    userId = profile?.user_id ?? null;
  }

  const { error: logError } = await supabase
    .from('revenuecat_events')
    .insert({
      event_id: event.id,
      user_id: userId,
      environment: event.environment,
      event_type: event.type,
      payload,
    });

  if (logError && logError.code !== '23505') {
    console.error('revenuecat_events insert failed', logError);
    return new Response('event log failed', { status: 500 });
  }

  if (!isSubscriptionWritingEvent(event)) {
    return new Response(JSON.stringify({ ok: true, logged: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!userId) {
    console.warn('app_user_id is not a Supabase user uuid', event.app_user_id);
    return new Response(JSON.stringify({ ok: true, logged: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const { status, willRenew } = deriveStatus(event);
  const entitlement = event.entitlement_ids?.[0] ?? PRO_ENTITLEMENT;
  // For access-terminating events, fall back to now() so that null doesn't
  // accidentally satisfy the `current_period_ends_at IS NULL` branch of is_pro.
  const isTerminatingEvent = event.type === 'CANCELLATION' || event.type === 'EXPIRATION';
  const currentPeriodEndsAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : isTerminatingEvent
      ? new Date().toISOString()
      : null;
  const trialEndsAt =
    event.period_type === 'TRIAL' && event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

  const baseRow: Record<string, unknown> = {
    user_id: userId,
    revenuecat_app_user_id: event.app_user_id,
    entitlement,
    status,
    product_id: event.product_id ?? null,
    store: event.store ?? null,
    current_period_ends_at: currentPeriodEndsAt,
    will_renew: willRenew,
    trial_ends_at: trialEndsAt,
  };

  if (event.type === 'INITIAL_PURCHASE') {
    Object.assign(baseRow, extractInitialAttribution(event));
  }

  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(baseRow, { onConflict: 'user_id' });

  if (upsertError) {
    console.error('subscriptions upsert failed', upsertError);
    return new Response('subscription write failed', { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});
