import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const REVENUECAT_SECRET_API_KEY = Deno.env.get('REVENUECAT_SECRET_API_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error('Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
}

/** Matches the app's PRO_ENTITLEMENT in entitlementResolution.ts. */
const PRO_ENTITLEMENT = 'Azora  Pro';
const REVENUECAT_TIMEOUT_MS = 5000;

const HOURLY_REQUEST_LIMIT = 30;
const DAILY_REQUEST_LIMIT = 100;

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhotoCleanupRequest {
  imageBase64?: unknown;
}

interface SubscriptionRow {
  status: string | null;
  current_period_ends_at: string | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

/** The client is allowed one downscaled JPEG, not an arbitrary data upload. */
function asJpegBase64(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 7_000_000) {
    return null;
  }
  return value;
}

function hasProAccess(subscription: SubscriptionRow | null): boolean {
  if (subscription == null) return false;
  if (!['active', 'trialing', 'in_grace_period'].includes(subscription.status ?? '')) {
    return false;
  }
  if (subscription.current_period_ends_at == null) return true;
  const endsAt = Date.parse(subscription.current_period_ends_at);
  return Number.isFinite(endsAt) && endsAt > Date.now();
}

/**
 * RevenueCat's own answer, for a Pro user the subscriptions table has not
 * caught up with — a purchase moved to a new account arrives as a TRANSFER,
 * which writes no row. Same lookup as azo-assist.
 */
async function hasRevenueCatPro(userId: string): Promise<boolean> {
  if (!REVENUECAT_SECRET_API_KEY) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REVENUECAT_TIMEOUT_MS);
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { authorization: `Bearer ${REVENUECAT_SECRET_API_KEY}` },
      signal: controller.signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      return false;
    }
    const body = await response.json() as {
      subscriber?: { entitlements?: Record<string, { expires_date?: string | null; grace_period_expires_date?: string | null }> };
    };
    const entitlement = body.subscriber?.entitlements?.[PRO_ENTITLEMENT];
    if (entitlement == null) return false;
    const endsAt = entitlement.grace_period_expires_date ?? entitlement.expires_date ?? null;
    if (endsAt == null) return true;
    const endsAtMs = Date.parse(endsAt);
    return Number.isFinite(endsAtMs) && endsAtMs > Date.now();
  } catch (error) {
    console.error('photo cleanup RevenueCat lookup failed', error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Keep provider output within the mobile plan contract before it leaves the server. */
function normalizePlan(value: unknown) {
  if (value == null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.objects)) return null;

  // Each estimate travels with its object, so dropping a bad object never shifts the minutes.
  const rawMinutes = Array.isArray(record.minutes) && record.minutes.length === record.objects.length
    ? record.minutes
    : null;
  const items = record.objects
    .map((object, index) => ({ object, minutes: rawMinutes?.[index] }))
    .filter((item): item is { object: string; minutes: unknown } => typeof item.object === 'string')
    .map((item) => ({ object: item.object.trim().slice(0, 120), minutes: item.minutes }))
    .filter((item) => item.object.length > 0)
    .slice(0, 20);
  if (items.length === 0) return null;
  const objects = items.map((item) => item.object);
  const minutes = rawMinutes == null
    ? undefined
    : items.map((item) =>
      typeof item.minutes === 'number' && Number.isFinite(item.minutes)
        ? Math.min(15, Math.max(1, Math.round(item.minutes)))
        : 2
    );

  const title = typeof record.title === 'string' && record.title.trim().length > 0
    ? record.title.trim().slice(0, 240)
    : 'Your cleaning plan';
  const safetyNote = typeof record.safetyNote === 'string' && record.safetyNote.trim().length > 0
    ? record.safetyNote.trim().slice(0, 220)
    : null;

  return { title, objects, minutes, safetyNote };
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['title', 'objects', 'minutes', 'safetyNote'],
  properties: {
    title: { type: 'string' },
    objects: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: { type: 'string' },
    },
    // One estimate per object, in the same order. Kept apart from `objects` so
    // app versions that read `objects` as plain strings keep working.
    minutes: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: { type: 'integer' },
    },
    // `responseSchema` is the legacy GenerateContent protobuf schema: it does
    // not accept JSON Schema type arrays. An empty string represents no note.
    safetyNote: { type: 'string' },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const authorization = req.headers.get('authorization');
  if (authorization == null) return json({ error: 'unauthorized' }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const jwt = authorization.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError != null || userData.user == null) return json({ error: 'unauthorized' }, 401);

  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('status, current_period_ends_at')
    .eq('user_id', userData.user.id)
    .maybeSingle<SubscriptionRow>();
  if (subscriptionError != null) {
    console.error('photo cleanup entitlement lookup failed', subscriptionError);
    return json({ error: 'Could not check your Pro access right now.' }, 503);
  }
  const isPro = hasProAccess(subscription) || await hasRevenueCatPro(userData.user.id);
  if (!isPro) {
    const { data: freeUse, error: freeUseError } = await supabase
      .from('photo_cleanup_free_uses')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (freeUseError != null) {
      console.error('photo cleanup free use lookup failed', freeUseError);
      return json({ error: 'Could not check your Pro access right now.' }, 503);
    }
    if (freeUse != null) {
      return json({ error: 'Photo cleanup is available with Azora Pro.' }, 403);
    }
  }

  let body: PhotoCleanupRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid request' }, 400);
  }

  const imageBase64 = asJpegBase64(body.imageBase64);
  if (imageBase64 == null) {
    return json({ error: 'invalid request' }, 400);
  }

  const { data: quotaAllowed, error: quotaError } = await supabase.rpc(
    'consume_photo_cleanup_quota',
    {
      p_user_id: userData.user.id,
      p_hourly_limit: HOURLY_REQUEST_LIMIT,
      p_daily_limit: DAILY_REQUEST_LIMIT,
    },
  );
  if (quotaError != null) {
    console.error('photo cleanup rate limit failed', quotaError);
    return json({ error: 'Could not prepare a cleaning plan right now.' }, 503);
  }
  if (quotaAllowed !== true) {
    return json(
      { error: 'You have used all of your photo cleanup plans for now. Please try again later.' },
      429,
    );
  }

  const prompt = `Look only at this room photo. Return an ordered cleanup list made of small, visible object groups.

Rules:
- Return object groups only — no instructions, encouragement, or commentary.
- Make each item one small, easy-to-start pickup action. Split broad categories into the actual places or types you can see. For example, prefer "Clothes on the bed", "Clothes on the floor", and "Shoes by the door" over "Clothes"; prefer "Mugs on the desk" and "Plates by the bed" over "Dishes".
- Do not combine separate surfaces, areas, or object types into one item. Avoid vague labels such as "Tidy the room", "Desk clutter", or "Miscellaneous items".
- Put the easiest, most useful visible item first, then continue in a practical order. Return every useful small group you can clearly see, aiming for 10–20 items when the photo supports it. Never invent objects that are not visible.
- Do not judge the room or diagnose anything.
- If you see or suspect needles, medication, bodily fluids, pests, mold, fire/electrical danger, unknown chemicals, or anything hazardous, do not include it as an object. Put a brief request to get appropriate help in safetyNote instead.
- When there is no safety concern, set safetyNote to an empty string.
- For every object, put a realistic estimate in minutes at the same position in minutes: how long one person needs to pick it up and put it where it belongs, as a whole number from 1 to 15. A few cups is 1 or 2; a pile of clothes on the floor might be 4 to 6.`;

  const geminiResponse = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: PLAN_SCHEMA,
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const providerError = await geminiResponse.text();
    console.error('Gemini photo cleanup request failed', {
      status: geminiResponse.status,
      providerError,
    });
    return json({ error: 'Could not make a cleaning plan right now.' }, 502);
  }

  const response = await geminiResponse.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  };
  const outputText = response.candidates?.[0]?.content?.parts?.find(
    (part) => typeof part.text === 'string',
  )?.text;
  if (typeof outputText !== 'string') {
    return json({ error: 'Could not make a cleaning plan right now.' }, 502);
  }
  try {
    const plan = normalizePlan(JSON.parse(outputText));
    if (plan == null) {
      console.error('Gemini photo cleanup response did not contain usable objects');
      return json({ error: 'Could not make a cleaning plan right now.' }, 502);
    }
    console.log('Photo cleanup plan response', { plan });
    if (!isPro) {
      const { error: recordError } = await supabase
        .from('photo_cleanup_free_uses')
        .upsert({ user_id: userData.user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
      if (recordError != null) {
        console.error('photo cleanup free use record failed', recordError);
      }
    }
    return json({ plan });
  } catch {
    return json({ error: 'Could not make a cleaning plan right now.' }, 502);
  }
});
