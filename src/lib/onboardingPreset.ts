import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';

/**
 * The plan the user is handed, and what it is called.
 *
 * Every name states a territory rather than a result. "Azora’s Sleep Reset"
 * only fits someone who asked for sleep; "Azora’s Night Reset" fits the person who asked
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
  /**
   * How the weeks split across Settle, Deepen and Carry. Authored per plan
   * rather than derived, because an eight-week plan wants three weeks of
   * settling and a four-week plan wants two, and no ratio produces both.
   */
  phaseWeeks: readonly [number, number, number];
}

const PRESETS: Record<PresetId, OnboardingPreset> = {
  night: { id: 'night', name: 'Azora’s Night Reset', weeks: 4, phaseWeeks: [2, 1, 1] },
  morning: { id: 'morning', name: 'Azora’s Morning Reset', weeks: 4, phaseWeeks: [2, 1, 1] },
  pressure: { id: 'pressure', name: 'Azora’s Pressure Reset', weeks: 8, phaseWeeks: [3, 3, 2] },
  focus: { id: 'focus', name: 'Azora’s Focus Reset', weeks: 6, phaseWeeks: [2, 2, 2] },
  quiet: { id: 'quiet', name: 'Azora’s Quiet Reset', weeks: 6, phaseWeeks: [2, 2, 2] },
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

/**
 * The three phases every plan runs, named the same way in all of them.
 *
 * Saying the structure out loud is what makes a generated plan read as
 * expertise rather than as a list — it is the whole reason Runna shows
 * Base/Build/Peak instead of just showing the week. The names are shared across
 * the catalogue so that a phase means one thing wherever a user meets it.
 *
 * Every plan ends in Carry, including the four-week ones. Carry is where the
 * guidance drops away, and that day is the only nameable moment in the whole
 * plan; a plan without one is a gradient, and nobody remembers a gradient.
 */
const PHASES: readonly { name: string; detail: string }[] = [
  { name: 'Settle', detail: 'the same reset, at the same time, every day' },
  { name: 'Deepen', detail: 'it gets longer, and the hold comes in' },
  { name: 'Carry', detail: 'no voice, no timer \u2014 you run it yourself' },
];

export interface PlanPhase {
  name: string;
  detail: string;
  startWeek: number;
  endWeek: number;
}

export function planPhases(intent: OnboardingIntent): PlanPhase[] {
  const { phaseWeeks } = onboardingPresetFor(intent);
  let week = 1;
  return PHASES.map((phase, index) => {
    const startWeek = week;
    week += phaseWeeks[index];
    return { ...phase, startWeek, endWeek: week - 1 };
  });
}

/** `Weeks 1–2`, or `Week 4` when the phase is a single week. */
export function planPhaseWeeksLabel(phase: PlanPhase): string {
  return phase.startWeek === phase.endWeek
    ? `Week ${phase.startWeek}`
    : `Weeks ${phase.startWeek}\u2013${phase.endWeek}`;
}

