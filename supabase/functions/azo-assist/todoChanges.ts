export const DAYPARTS = ['start', 'afternoon', 'evening', 'bedtime'] as const;

export type Daypart = typeof DAYPARTS[number];

/** One of today's to-dos as the app describes it, under a short ref Azo points back at. */
export interface TodoRef {
  ref: string;
  title: string;
  daypart: Daypart | null;
  minutes: number | null;
  /** removing a repeat removes it from every day, so Azo should know */
  repeats: boolean;
  done: boolean;
  /** the later day a one-off is planned for, or null when it is on today's list */
  day: string | null;
}

export type TodoChange =
  | { ref: string; action: 'remove' }
  | { ref: string; action: 'update'; title?: string; daypart?: Daypart; minutes?: number; day?: string };

const MAX_REFS = 30;
const MAX_TITLE = 100;
export const MAX_CHANGES = 8;
const REF_PATTERN = /^t\d{1,2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
/** Today and the six days after it, matching the app's Day picker. */
const PLAN_DAYS = 7;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dateMs(localDate: string): number {
  const [year, month, day] = localDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function weekday(localDate: string): string {
  return WEEKDAYS[new Date(dateMs(localDate)).getUTCDay()];
}

/**
 * The person's local today, sent only by an app that can plan ahead; null from
 * an older one, which keeps every to-do on today. A date more than a day from
 * the server's is not a real local today, so it turns planning off too.
 */
export function parsePlanDays(value: unknown, now = Date.now()): string[] | null {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null;
  const start = dateMs(value);
  if (!Number.isFinite(start) || Math.abs(start - now) > 2 * DAY_MS) return null;
  return Array.from({ length: PLAN_DAYS }, (_, offset) => new Date(start + offset * DAY_MS).toISOString().slice(0, 10));
}

const LATER_DAY_WORDS = /\b(today|tonight|tomorrow|tmrw|weekend|week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thur?s?|fri|sat|sun|days?|\d{1,2}(st|nd|rd|th))\b/i;

/** A to-do only moves off today when the person named a day for it. */
export function mentionsDay(text: string): boolean {
  return LATER_DAY_WORDS.test(text);
}

/** The day to keep: one of the plan's days, named by the person, and not where it already is. */
export function cleanPlanDay(value: unknown, days: readonly string[] | null, named: boolean, current: string): string | null {
  if (days == null || !named || typeof value !== 'string' || !days.includes(value) || value === current) return null;
  return value;
}

function cleanTitle(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length === 0 ? null : text.slice(0, max);
}

function isDaypart(value: unknown): value is Daypart {
  return (DAYPARTS as readonly unknown[]).includes(value);
}

/** Null when the app sent none: an older build, which only knows how to add. */
export function parseTodoRefs(value: unknown): TodoRef[] | null {
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  return value.slice(0, MAX_REFS).flatMap((item): TodoRef[] => {
    if (item == null || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const title = cleanTitle(record.title, 120);
    if (typeof record.ref !== 'string' || !REF_PATTERN.test(record.ref) || seen.has(record.ref) || title == null) {
      return [];
    }
    seen.add(record.ref);
    return [{
      ref: record.ref,
      title,
      daypart: isDaypart(record.daypart) ? record.daypart : null,
      minutes: typeof record.minutes === 'number' && Number.isFinite(record.minutes) ? Math.round(record.minutes) : null,
      repeats: record.repeats === true,
      done: record.done === true,
      day: typeof record.day === 'string' && DATE_PATTERN.test(record.day) ? record.day : null,
    }];
  });
}

/**
 * A change survives only if it points at a to-do they have, that is still open,
 * once per to-do, quoting words they just said, and actually changes something.
 */
export function normalizeTodoChanges(
  value: unknown,
  refs: readonly TodoRef[],
  grounded: (source: unknown) => boolean,
  plan: { days: readonly string[]; named: boolean } | null = null,
): TodoChange[] {
  if (!Array.isArray(value)) return [];
  const touched = new Set<string>();
  return value.flatMap((item): TodoChange[] => {
    if (item == null || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const target = refs.find((todo) => todo.ref === record.ref);
    if (target == null || target.done || touched.has(target.ref) || !grounded(record.source)) return [];

    if (record.action === 'remove') {
      touched.add(target.ref);
      return [{ ref: target.ref, action: 'remove' }];
    }
    if (record.action !== 'update') return [];

    const title = cleanTitle(record.title, MAX_TITLE);
    const minutes = typeof record.minutes === 'number' && Number.isFinite(record.minutes)
      ? Math.min(120, Math.max(1, Math.round(record.minutes)))
      : null;
    // Only a one-off can wait for a later day.
    const day = plan == null || target.repeats
      ? null
      : cleanPlanDay(record.day, plan.days, plan.named, target.day ?? plan.days[0]);
    const change: TodoChange = {
      ref: target.ref,
      action: 'update',
      ...(title != null && title.toLowerCase() !== target.title.toLowerCase() ? { title } : {}),
      ...(isDaypart(record.daypart) && record.daypart !== target.daypart ? { daypart: record.daypart } : {}),
      ...(minutes != null && minutes !== target.minutes ? { minutes } : {}),
      ...(day == null ? {} : { day }),
    };
    if (Object.keys(change).length === 2) return [];
    touched.add(target.ref);
    return [change];
  }).slice(0, MAX_CHANGES);
}

export function todoRefsLine(refs: readonly TodoRef[]): string {
  if (refs.length === 0) return 'They have no to-dos today yet.';
  const lines = refs.map((todo) => {
    const details = [
      todo.daypart ?? 'any time',
      ...(todo.minutes == null ? [] : [`${todo.minutes} min`]),
      ...(todo.repeats ? ['repeats'] : []),
      ...(todo.done ? ['done'] : []),
      ...(todo.day == null ? [] : [`planned for ${weekday(todo.day)} ${todo.day}, not on today's list yet`]),
    ];
    return `- ${todo.ref}: "${todo.title}" (${details.join(', ')})`;
  });
  return `Already on their list today (never suggest these again, reworded, or as a step of them):\n${lines.join('\n')}`;
}

export function changeSchema(refs: readonly TodoRef[], days: readonly string[] | null) {
  return {
    type: 'object',
    required: ['source', 'action', 'ref'],
    propertyOrdering: ['source', 'action', 'ref', 'title', 'daypart', 'minutes', ...(days == null ? [] : ['day'])],
    properties: {
      source: { type: 'string' },
      action: { type: 'string', format: 'enum', enum: ['remove', 'update'] },
      ref: { type: 'string', format: 'enum', enum: refs.map((todo) => todo.ref) },
      title: { type: 'string' },
      daypart: { type: 'string', format: 'enum', enum: [...DAYPARTS] },
      minutes: { type: 'integer' },
      ...(days == null ? {} : { day: dayProperty(days) }),
    },
  };
}

export function dayProperty(days: readonly string[]) {
  return { type: 'string', format: 'enum', enum: [...days] };
}

export function planInstruction(days: readonly string[]): string {
  const list = days.map((day, index) =>
    `${day} (${weekday(day)}${index === 0 ? ', today' : index === 1 ? ', tomorrow' : ''})`).join(', ');
  return `Planning ahead:
- Days you can plan for: ${list}.
- day puts a one-off to-do on a later day. Leave it out for today. Only set it when they name the day for that task ("tomorrow", "on Saturday", "this weekend" means the coming Saturday); never spread their tasks across the week on your own.
- In an update, day moves a one-off to another day; ${days[0]} brings a planned one back to today. Never set day on a to-do marked repeats.
- Nothing can be planned later than ${weekday(days[days.length - 1])} ${days[days.length - 1]}: leave such a task out and say you can plan up to then.`;
}

export const CHANGE_RULES = `Changing their list:
- change: their last message asks to remove, drop, cancel, rename, reword, move to another part of the day, or shorten or lengthen something already on their list. Return changes for it; todos stay empty. If they also name new things to do, choose add and return both.
- Only change a to-do their last message clearly points at, by name or unmistakably ("the gym one", "the first one"). If it could be more than one, choose talk and ask which.
- Never remove or change a to-do on your own initiative, because it seems unnecessary, or because they sound busy. Never touch one marked done.
- If they mention self-harm, suicide, abuse or being in danger, return no changes.
- source is their exact words from their last message asking for this change (2–8 words).
- remove takes it off their list. The card warns them when a to-do repeats, so don't ask twice.
- update only fills the fields that change: title (a new verb-first title under 10 words), daypart, or minutes.
- With change, the reply introduces the changes in one short line, never claims they're done (they confirm on the cards) and never lists them.`;
