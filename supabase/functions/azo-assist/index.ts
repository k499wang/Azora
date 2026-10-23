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
  | { mode: 'plan'; brainDump: string; todos: string[] }
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

  const todos = cleanTodoTitles(record.todos);

  if (record.mode === 'plan') {
    const brainDump = cleanText(record.brainDump, MAX_TEXT);
    return brainDump == null ? null : { mode: 'plan', brainDump, todos };
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
    return { mode: 'chat', messages, todos };
  }

  return null;
}

function normalizeTodos(value: unknown, max: number): SuggestedTodo[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): SuggestedTodo[] => {
    if (item == null || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const title = cleanText(record.title, MAX_TODO_TITLE);
    if (title == null) return [];
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

function normalizePlan(value: unknown): { todos: SuggestedTodo[] } | null {
  if (value == null || typeof value !== 'object') return null;
  const todos = normalizeTodos((value as Record<string, unknown>).todos, 8);
  return todos.length === 0 ? null : { todos };
}

function normalizeTranscript(value: unknown): { text: string } | null {
  if (value == null || typeof value !== 'object') return null;
  const text = cleanText((value as Record<string, unknown>).text, MAX_TEXT);
  return text == null ? null : { text };
}

function normalizeChat(value: unknown): { reply: string; todos: SuggestedTodo[] } | null {
  if (value == null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const reply = cleanText(record.reply, 900);
  if (reply == null) return null;
  return { reply, todos: normalizeTodos(record.todos, 3) };
}

const TODO_SCHEMA = {
  type: 'object',
  required: ['title', 'icon', 'daypart', 'minutes'],
  properties: {
    title: { type: 'string' },
    icon: { type: 'string', format: 'enum', enum: [...TODO_ICONS] },
    daypart: { type: 'string', format: 'enum', enum: [...DAYPARTS] },
    minutes: { type: 'integer' },
  },
};

const PLAN_SCHEMA = {
  type: 'object',
  required: ['todos'],
  properties: {
    todos: { type: 'array', minItems: 1, maxItems: 8, items: TODO_SCHEMA },
  },
};

const TRANSCRIPT_SCHEMA = {
  type: 'object',
  required: ['text'],
  properties: { text: { type: 'string' } },
};

const TRANSCRIBE_PROMPT = `Write down exactly what the person says in this voice note, in their language, with light punctuation. Leave out filler sounds like "um". If nothing is said, return an empty string. Return only their words.`;

const CHAT_SCHEMA = {
  type: 'object',
  required: ['reply', 'todos'],
  properties: {
    reply: { type: 'string' },
    todos: { type: 'array', maxItems: 3, items: TODO_SCHEMA },
  },
};

const TODO_RULES = `To-do rules:
- Make every to-do about this person's actual situation, never generic advice. Reuse the exact names, places, objects, deadlines and times they mentioned. "Reply to Sam about Saturday's dinner" beats "Answer messages"; "Call Dr. Lee's office to book a cleaning" beats "Book dentist".
- Each title is one concrete, finishable action that starts with a verb, under 10 words, written the way they'd write it for themselves.
- Someone should know exactly what to do the moment they read it. If they'd still have to decide what "it" means, make it more specific.
- Break anything big or dreaded into its real steps, in order, as separate to-dos: "Do taxes" becomes "Find last year's tax return", then "List this year's income documents". Skip steps they've said are done.
- Fit their day: respect any times, energy level, plans or limits they mention, and put draining things where they'll have the most energy.
- No filler. Only add rest or self-care, like a walk or water, when what they said calls for it, and tie it to their situation ("Step outside after the 3pm call").
- daypart is when it fits best: start (morning), afternoon, evening, bedtime.
- minutes is an honest estimate for that exact action.
- Pick the closest icon from the list.
- Never repeat a to-do the person already has.`;

function existingTodosLine(todos: string[]): string {
  return todos.length === 0
    ? 'They have no to-dos today yet.'
    : `Their to-dos today: ${todos.map((title) => `"${title}"`).join(', ')}.`;
}

function planPrompt(request: Extract<AzoAssistRequest, { mode: 'plan' }>): string {
  return `You are Azo, a friendly koala who helps people turn a messy head into a calm, doable day.

The person wrote everything on their mind:
"""
${request.brainDump}
"""

${existingTodosLine(request.todos)}

Read it closely: what's urgent, what's been weighing on them, what they're dreading, and what they can't change today. Turn it into 3–8 to-dos for today. Cover the things they actually named, lead with what will take the most weight off their mind, drop what doesn't belong to today, and order them in the order they should happen.

${TODO_RULES}`;
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

When a concrete action would help, suggest 1–3 to-dos they can add to today with one tap, and mention them naturally in your reply. When they just want to talk, suggest none.

${TODO_RULES}

Conversation so far:
${transcript}

Reply as Azo to the last message.`;
}


const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error('Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
}

const HOURLY_REQUEST_LIMIT = 40;
const DAILY_REQUEST_LIMIT = 150;
/** Lifetime chat or plan answers before Pro. The app reads the same number from featureAccessCore. */
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
    case 'plan':
      return { parts: [{ text: planPrompt(request) }], schema: PLAN_SCHEMA, normalize: normalizePlan };
    case 'chat':
      return { parts: [{ text: chatPrompt(request) }], schema: CHAT_SCHEMA, normalize: normalizeChat };
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
  const isPro = hasProAccess(subscription);
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
