import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** What Azo can draw a suggested to-do with. The app re-checks against its own picker list. */
const TODO_ICONS = [
  'sparkle', 'sun', 'sunrise', 'moon', 'heart', 'walk', 'dumbbell', 'yoga', 'book',
  'journal', 'pencil', 'message', 'coffee-outline', 'bed-clock', 'home',
  'todo-plan', 'todo-priorities', 'todo-focus-timer', 'todo-tidy', 'todo-pack',
  'todo-dishes', 'todo-counter', 'todo-bed', 'todo-washer', 'todo-fold', 'todo-hamper',
  'todo-surface', 'todo-broom', 'todo-mail', 'todo-breath', 'todo-grounding',
  'todo-fresh-air', 'todo-worry-note', 'todo-screen-free', 'todo-curtains',
  'todo-water', 'todo-shower', 'todo-meal', 'todo-message',
] as const;

const DAYPARTS = ['start', 'afternoon', 'evening', 'bedtime'] as const;

type Daypart = typeof DAYPARTS[number];

interface SuggestedTodo {
  title: string;
  icon: string;
  daypart: Daypart;
  minutes: number;
}

interface ChatTurn {
  role: 'user' | 'azo';
  text: string;
}

type AzoAssistRequest =
  | { mode: 'transcribe'; audioBase64: string }
  | { mode: 'chat'; messages: ChatTurn[]; todos: string[] };

const MAX_TEXT = 1000;
const MAX_TODO_TITLE = 100;
const MAX_TURNS = 20;
const MAX_CONTEXT_TODOS = 30;
/** About a minute of the app's mono 32 kbps voice note, with headroom. */
const MAX_AUDIO_BASE64 = 1_500_000;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length === 0 ? null : text.slice(0, max);
}

function cleanTodoTitles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((title) => cleanText(title, 120))
    .filter((title): title is string => title != null)
    .slice(0, MAX_CONTEXT_TODOS);
}

function parseRequest(body: unknown): AzoAssistRequest | null {
  if (body == null || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;

  if (record.mode === 'transcribe') {
    const audio = record.audioBase64;
    return typeof audio === 'string' && audio.length > 0 && audio.length <= MAX_AUDIO_BASE64
      ? { mode: 'transcribe', audioBase64: audio }
      : null;
  }

  if (record.mode === 'chat' && Array.isArray(record.messages)) {
    const messages = record.messages.slice(-MAX_TURNS).flatMap((turn): ChatTurn[] => {
      if (turn == null || typeof turn !== 'object') return [];
      const { role, text } = turn as Record<string, unknown>;
      const clean = cleanText(text, MAX_TEXT);
      if (clean == null || (role !== 'user' && role !== 'azo')) return [];
      return [{ role, text: clean }];
    });
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return null;
    return { mode: 'chat', messages, todos: cleanTodoTitles(record.todos) };
  }

  return null;
}

/** Lowercased words with a plural "s" dropped, so "doctor" matches "doctors". */
function words(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean)
    .map((word) => word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word);
}

/** Lets a model paraphrase a word or two of its quote, never invent the whole thing. */
const GROUNDED_SHARE = 0.5;

/** A to-do only survives if most of the words it quotes as its source are words the person actually used. */
function isGrounded(source: unknown, personText: string): boolean {
  if (typeof source !== 'string') return false;
  const quoted = words(source);
  if (quoted.length === 0) return false;
  const said = new Set(words(personText));
  return quoted.filter((word) => said.has(word)).length / quoted.length >= GROUNDED_SHARE;
}

function normalizeTodos(value: unknown, max: number, personText: string): SuggestedTodo[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): SuggestedTodo[] => {
    if (item == null || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const title = cleanText(record.title, MAX_TODO_TITLE);
    if (title == null || !isGrounded(record.source, personText)) return [];
    const icon = (TODO_ICONS as readonly unknown[]).includes(record.icon)
      ? record.icon as string
      : 'sparkle';
    const daypart = (DAYPARTS as readonly unknown[]).includes(record.daypart)
      ? record.daypart as Daypart
      : 'afternoon';
    const minutes = typeof record.minutes === 'number' && Number.isFinite(record.minutes)
      ? Math.min(120, Math.max(1, Math.round(record.minutes)))
      : 10;
    return [{ title, icon, daypart, minutes }];
  }).slice(0, max);
}

function normalizeTranscript(value: unknown): { text: string } | null {
  if (value == null || typeof value !== 'object') return null;
  const text = cleanText((value as Record<string, unknown>).text, MAX_TEXT);
  return text == null ? null : { text };
}

function chatPersonText(request: Extract<AzoAssistRequest, { mode: 'chat' }>): string {
  return request.messages.filter((turn) => turn.role === 'user').map((turn) => turn.text).join(' ');
}

/** To-dos only come with an `add` reply: they agreed to Azo's offer or asked for them outright. */
function normalizeChat(
  value: unknown,
  request: Extract<AzoAssistRequest, { mode: 'chat' }>,
): { reply: string; todos: SuggestedTodo[] } | null {
  if (value == null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const reply = cleanText(record.reply, 900);
  if (reply == null) return null;
  const todos = record.kind === 'add' ? normalizeTodos(record.todos, 8, chatPersonText(request)) : [];
  const returned = Array.isArray(record.todos) ? record.todos.length : 0;
  if (returned !== todos.length) {
    console.log('azo chat dropped to-dos', { kind: record.kind, returned, kept: todos.length });
  }
  return { reply, todos };
}

const TODO_SCHEMA = {
  type: 'object',
  required: ['source', 'title', 'icon', 'daypart', 'minutes'],
  propertyOrdering: ['source', 'title', 'icon', 'daypart', 'minutes'],
  properties: {
    source: { type: 'string' },
    title: { type: 'string' },
    icon: { type: 'string', format: 'enum', enum: [...TODO_ICONS] },
    daypart: { type: 'string', format: 'enum', enum: [...DAYPARTS] },
    minutes: { type: 'integer' },
  },
};

const TRANSCRIPT_SCHEMA = {
  type: 'object',
  required: ['text'],
  properties: { text: { type: 'string' } },
};

const TRANSCRIBE_PROMPT = `Write down exactly what the person says in this voice note, in their language, with light punctuation. Leave out filler sounds like "um". If nothing is said, return an empty string. Return only their words.`;

const CHAT_KINDS = ['talk', 'offer', 'add'] as const;

const CHAT_SCHEMA = {
  type: 'object',
  required: ['kind', 'reply', 'todos'],
  propertyOrdering: ['kind', 'todos', 'reply'],
  properties: {
    kind: { type: 'string', format: 'enum', enum: [...CHAT_KINDS] },
    reply: { type: 'string' },
    todos: { type: 'array', maxItems: 8, items: TODO_SCHEMA },
  },
};

const TODO_RULES = `To-do rules:
- source is the exact words, copied from the person's own messages, that this to-do comes from (2–8 words). If you can't point to their words, it isn't a to-do: leave it out.
- Make every to-do about this person's actual situation, never generic advice. Reuse the exact names, places, objects, deadlines and times they mentioned. "Reply to Sam about Saturday's dinner" beats "Answer messages"; "Call Dr. Lee's office to book a cleaning" beats "Book dentist".
- Each title is one concrete, finishable action that starts with a verb, under 10 words, written the way they'd write it for themselves.
- Someone should know exactly what to do the moment they read it. If they'd still have to decide what "it" means, make it more specific.
- Break anything big or dreaded into its real steps, in order, as separate to-dos: "Do taxes" becomes "Find last year's tax return", then "List this year's income documents". Skip steps they've said are done.
- Fit their day: respect any times, energy level, plans or limits they mention, and put draining things where they'll have the most energy.
- Never invent tasks. Every to-do must come from something they said, either the thing itself or a step of it. If they named one thing, one or two to-dos is right; fewer real to-dos beat padding.
- Only add rest or self-care, like a walk or water, when they said they're tired, stressed or skipping it; its source is where they said so. Tie it to their situation ("Step outside after the 3pm call").
- daypart is when it fits best: start (morning), afternoon, evening, bedtime.
- minutes is an honest estimate for that exact action.
- Pick the closest icon from the list.
- Never repeat a to-do the person already has.`;

function existingTodosLine(todos: string[]): string {
  return todos.length === 0
    ? 'They have no to-dos today yet.'
    : `Their to-dos today: ${todos.map((title) => `"${title}"`).join(', ')}.`;
}

function chatPrompt(request: Extract<AzoAssistRequest, { mode: 'chat' }>): string {
  const transcript = request.messages
    .map((turn) => `${turn.role === 'user' ? 'Person' : 'Azo'}: ${turn.text}`)
    .join('\n');
  return `You are Azo, a warm koala buddy inside Azora, an app that helps people reset their day with a personalized plan of small to-dos, short lessons and calming exercises.

How you talk:
- Short: 1–3 sentences, under 70 words. Plain words, like a kind friend texting.
- Name the feeling, then offer one tiny next step. Never lecture.
- Confident and encouraging. No therapy-speak, no diagnoses, no medical advice.
- Never use the word "breathwork".
- If they mention self-harm, suicide, abuse or being in danger, reply with care, tell them to contact local emergency services or a crisis line, point them to findahelpline.com, and suggest no to-dos.

${existingTodosLine(request.todos)}

kind decides whether to-dos appear:
- talk: they're venting, sharing or asking something. Just reply. This is the usual case.
- offer: a concrete to-do from something they said would clearly help. Name it in your reply and ask if they want it added ("Want me to add 'Call Dr. Lee's office' to today?"). Return no to-dos yet.
- add: they said yes to your last offer, they asked you outright to add, plan or list to-dos, they listed things they need to do (the chat invites them to dump everything for a plan, so a list of tasks is a plan request), or they're answering your "What's on your mind today?" Return to-dos for what they named: one or two for a single thing, one per real task (up to 8) for a list, in the order they should happen. If what they said is too vague to act on, choose talk and ask one short question that gets the concrete thing, like "What's the one thing that has to happen today?"
Never offer twice in a row, and never offer when they're upset and just want to be heard. When unsure, choose talk. Only add returns to-dos.
Your reply must match your to-dos: with add, introduce the to-dos you returned in one short line, never list them in the reply, since they show as cards under it. With talk or offer, never say "here are" or list steps as if they were added.

${TODO_RULES}

Conversation so far:
${transcript}

Reply as Azo to the last message.`;
}


const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const REVENUECAT_SECRET_API_KEY = Deno.env.get('REVENUECAT_SECRET_API_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error('Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
}

const HOURLY_REQUEST_LIMIT = 40;
const DAILY_REQUEST_LIMIT = 150;
/** Lifetime Azo answers before Pro. The app reads the same number from featureAccessCore. */
const FREE_MESSAGES = 3;

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

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

function hasProAccess(subscription: SubscriptionRow | null): boolean {
  if (subscription == null) return false;
  if (!['active', 'trialing', 'in_grace_period'].includes(subscription.status ?? '')) {
    return false;
  }
  if (subscription.current_period_ends_at == null) return true;
  const endsAt = Date.parse(subscription.current_period_ends_at);
  return Number.isFinite(endsAt) && endsAt > Date.now();
}

/** Matches the app's PRO_ENTITLEMENT in entitlementResolution.ts. */
const PRO_ENTITLEMENT = 'Azora  Pro';
const REVENUECAT_TIMEOUT_MS = 5000;

/**
 * The app also trusts RevenueCat while the webhook mirror catches up after a
 * purchase, so the server asks it too before treating a Pro user as free.
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
    console.error('azo assist RevenueCat lookup failed', error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function modelCall(request: AzoAssistRequest) {
  switch (request.mode) {
    case 'transcribe':
      return {
        parts: [
          { text: TRANSCRIBE_PROMPT },
          { inlineData: { mimeType: 'audio/mp4', data: request.audioBase64 } },
        ],
        schema: TRANSCRIPT_SCHEMA,
        normalize: normalizeTranscript,
      };
    case 'chat':
      return {
        parts: [{ text: chatPrompt(request) }],
        schema: CHAT_SCHEMA,
        normalize: (value: unknown) => normalizeChat(value, request),
      };
  }
}

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
    console.error('azo assist entitlement lookup failed', subscriptionError);
    return json({ error: 'Could not check your Pro access right now.' }, 503);
  }
  const isPro = hasProAccess(subscription) || await hasRevenueCatPro(userData.user.id);
  let freeMessagesUsed = 0;
  if (!isPro) {
    const { data: freeUse, error: freeUseError } = await supabase
      .from('azo_assist_free_messages')
      .select('used_count')
      .eq('user_id', userData.user.id)
      .maybeSingle<{ used_count: number }>();
    if (freeUseError != null) {
      console.error('azo assist free message lookup failed', freeUseError);
      return json({ error: 'Could not check your Pro access right now.' }, 503);
    }
    freeMessagesUsed = freeUse?.used_count ?? 0;
    if (freeMessagesUsed >= FREE_MESSAGES) {
      return json({ error: 'Azo is available with Azora Pro.', freeMessagesLeft: 0 }, 403);
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid request' }, 400);
  }
  const request = parseRequest(body);
  if (request == null) return json({ error: 'invalid request' }, 400);

  const { data: quotaAllowed, error: quotaError } = await supabase.rpc(
    'consume_azo_assist_quota',
    {
      p_user_id: userData.user.id,
      p_hourly_limit: HOURLY_REQUEST_LIMIT,
      p_daily_limit: DAILY_REQUEST_LIMIT,
    },
  );
  if (quotaError != null) {
    console.error('azo assist rate limit failed', quotaError);
    return json({ error: 'Azo needs a moment. Try again soon.' }, 503);
  }
  if (quotaAllowed !== true) {
    return json({ error: 'Azo needs a little rest. Try again in a while.' }, 429);
  }

  const call = modelCall(request);
  const geminiResponse = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: call.parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: call.schema,
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    console.error('Gemini azo assist request failed', {
      mode: request.mode,
      status: geminiResponse.status,
      providerError: await geminiResponse.text(),
    });
    return json({ error: 'Azo couldn’t answer right now. Try again.' }, 502);
  }

  const response = await geminiResponse.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  };
  const outputText = response.candidates?.[0]?.content?.parts?.find(
    (part) => typeof part.text === 'string',
  )?.text;
  if (typeof outputText !== 'string') {
    return json({ error: 'Azo couldn’t answer right now. Try again.' }, 502);
  }
  try {
    const parsed = JSON.parse(outputText);
    const result = call.normalize(parsed);
    if (result == null) {
      console.error('Gemini azo assist response was unusable', { mode: request.mode });
      return json({ error: 'Azo couldn’t answer right now. Try again.' }, 502);
    }
    if (isPro) return json(result);
    // A voice note only fills the text box; the answer it leads to is what counts.
    if (request.mode === 'transcribe') {
      return json({ ...result, freeMessagesLeft: FREE_MESSAGES - freeMessagesUsed });
    }
    const { data: usedCount, error: recordError } = await supabase.rpc(
      'record_azo_assist_free_message',
      { p_user_id: userData.user.id },
    );
    if (recordError != null) console.error('azo assist free message record failed', recordError);
    const used = typeof usedCount === 'number' ? usedCount : freeMessagesUsed + 1;
    return json({ ...result, freeMessagesLeft: Math.max(0, FREE_MESSAGES - used) });
  } catch {
    return json({ error: 'Azo couldn’t answer right now. Try again.' }, 502);
  }
});
