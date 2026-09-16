import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';

/**
 * The plan the user is handed, and what it is called.
 *
 * Every name states a territory rather than a result. "The Sleep Reset" only
 * fits someone who asked for sleep; "The Night Reset" fits the person who asked
 * for sleep, the one who wakes at 3am and the one who cannot put the phone down,
 * which matters because the goal question is multi-select and the plan has to
 * hold everything they picked. Naming the territory is also what keeps the name
 * clear of `design.md` principle 4 — a territory promises nothing.
 *
 * Every name ends in Reset, so the plan points at the daily unit it is made of,
 * and the set reads as a catalogue rather than as six unrelated products.
 */
export type PresetId =
  | 'night'
  | 'morning'
  | 'pressure'
  | 'focus'
  | 'quiet';

export interface OnboardingPreset {
  id: PresetId;
  name: string;
  /**
   * How long the plan runs. The length is the behaviour-change arc, not a
   * content budget — a plan with no end cannot be finished, and a user who
   * cannot finish has nothing to be on day 4 of.
   */
  weeks: number;
}

const PRESETS: Record<PresetId, OnboardingPreset> = {
  night: { id: 'night', name: 'The Night Reset', weeks: 4 },
  morning: { id: 'morning', name: 'The Morning Reset', weeks: 4 },
  pressure: { id: 'pressure', name: 'The Pressure Reset', weeks: 8 },
  focus: { id: 'focus', name: 'The Focus Reset', weeks: 6 },
  quiet: { id: 'quiet', name: 'The Quiet Reset', weeks: 6 },
};

/**
 * Which plan a goal asks for. Goals share a preset wherever they share a
 * territory: someone here for their heart, someone here for steadier days and
 * someone here to stop spiralling all want the same eight weeks, and authoring
 * three near-identical plans to give each its own title would be a naming
 * exercise rather than a product one.
 */
const PRESET_FOR_INTENT: Record<OnboardingIntent, PresetId> = {
  sleep: 'night',
  energy: 'morning',
  stress_relief: 'pressure',
  calm_fast: 'pressure',
  emotional_balance: 'pressure',
  self_acceptance: 'pressure',
  heart_health: 'pressure',
  focus: 'focus',
  daily_habit: 'focus',
  spiritual: 'quiet',
  self_care: 'quiet',
  yoga: 'quiet',
  // Says nothing about direction, so it gets the broadest territory.
  other: 'pressure',
};

/**
 * The goal as it sits inside "built around ___". Authored next to nothing else,
 * because the goal's own `goalPhrase` is a verb ("sleep better") and this slot
 * needs a noun. `other` has no fragment: there is nothing specific to name.
 */
const GOAL_SUBJECT: Record<OnboardingIntent, string | null> = {
  sleep: 'sleep',
  energy: 'energy',
  stress_relief: 'stress',
  calm_fast: 'the spikes',
  emotional_balance: 'steadier days',
  self_acceptance: 'being kinder to yourself',
  heart_health: 'your heart',
  focus: 'focus',
  daily_habit: 'a routine that sticks',
  spiritual: 'quiet',
  self_care: 'looking after yourself',
  yoga: 'time on the mat',
  other: null,
};

/** At most two goals are named; a list of five reads as a receipt, not a plan. */
const MAX_NAMED_GOALS = 2;

export function onboardingPresetFor(intent: OnboardingIntent): OnboardingPreset {
  return PRESETS[PRESET_FOR_INTENT[intent]];
}

export function planNameFor(intent: OnboardingIntent): string {
  return onboardingPresetFor(intent).name;
}

/**
 * `built around sleep and focus` — the line that connects the plan's territory
 * back to what they actually picked.
 *
 * The one they ranked first leads. Nothing beyond two is named: the preset was
 * chosen to cover the whole neighbourhood, so the line's job is to show the
 * connection, not to enumerate the answers back at them.
 */
export function planGoalsLine(
  primary: OnboardingIntent | null,
  selected: readonly OnboardingIntent[],
): string | null {
  const ordered = [
    ...(primary == null ? [] : [primary]),
    ...selected.filter((intent) => intent !== primary),
  ];

  const subjects: string[] = [];
  for (const intent of ordered) {
    const subject = GOAL_SUBJECT[intent];
    if (subject == null || subjects.includes(subject)) continue;
    subjects.push(subject);
    if (subjects.length === MAX_NAMED_GOALS) break;
  }

  if (subjects.length === 0) return null;
  return `built around ${subjects.join(' and ')}`;
}

const DAYS_PER_WEEK = 7;
const MONTH_LABEL = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * The day the plan runs out, counted from the day it starts.
 *
 * A date is a fact about a schedule, not a prediction about a person — which is
 * the whole reason the plan is allowed to be dated at all. Nothing here claims
 * anyone will feel a particular way by then.
 */
export function planFinishDate(intent: OnboardingIntent, startedOn: Date): Date {
  const finish = new Date(startedOn);
  finish.setDate(finish.getDate() + onboardingPresetFor(intent).weeks * DAYS_PER_WEEK);
  return finish;
}

/** `Oct 14` — hand-formatted, as `formatPlanTime` is, rather than via Intl. */
export function formatPlanDate(date: Date): string {
  return `${MONTH_LABEL[date.getMonth()]} ${date.getDate()}`;
}

/** `4 weeks · finishes Oct 14` */
export function planHorizonLabel(
  intent: OnboardingIntent,
  startedOn: Date,
): string {
  const weeks = onboardingPresetFor(intent).weeks;
  return `${weeks} weeks · finishes ${formatPlanDate(planFinishDate(intent, startedOn))}`;
}
