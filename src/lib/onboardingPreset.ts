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
const PHASE_NAMES = [
  'Settling in',
  'When it starts to stick',
  'By the end of it',
] as const;

/**
 * What the user brings to the ladder, so every rung is written in their numbers
 * and on their calendar rather than in general ones.
 *
 * A plan that says "Week 3" is a structure; a plan that says "by 8 October, 71"
 * is something to hold yourself to. The projection is the point of the screen,
 * the way the goal-weight chart is the point of BetterMe's.
 */
export interface PlanLadderContext {
  /** The daily reset length the plan starts them at, in minutes. */
  startMinutes: number;
  /** When the primary reset sits, already formatted — `9:30 PM`. */
  startTime: string | null;
  /** Day one of the plan — today, for everyone who finishes onboarding. */
  startDate: Date;
  /** How many resets a day the plan asks for, as the list below shows them. */
  resetCount: number;
  /** Minutes a day, all resets together. */
  fullMinutes: number;
}

/**
 * What a phase is, and what you can do by the end of it.
 *
 * `detail` is what changes in the practice; `reach` is what changes in the
 * person, which is the half a user can picture themselves standing on. Both are
 * authored per plan rather than shared, because "the same reset, every day"
 * means a night for the Night plan and a session of work for the Focus one, and
 * one sentence cannot be true of both without being true of neither.
 *
 * Two rules the whole table is written to, both taken from how coaching plans
 * that people actually finish are written:
 *
 * - **Every rung hands off to the next one.** Runna's base phase is not "easy
 *   running", it is what makes you "ready to cope with the demands" of the
 *   block after it. A rung that does not say what it sets up is a list item.
 * - **A curve, not a line.** The first stretch moves fastest, the middle feels
 *   slower than it is, and the last is where other people notice before you do.
 *   Saying that up front is what stops week three reading as a failure — it is
 *   the single most-repeated finding in how these plans are written.
 */
/** Where a step sits in the plan, for copy that counts weeks or rooms. */
interface PhaseMeta {
  endWeek: number;
  totalWeeks: number;
}

type PhaseLine = (context: PlanLadderContext, meta: PhaseMeta) => string;

interface PlanPhaseCopy {
  /** What the plan asks for, and what it feels like to be doing it. */
  detail: PhaseLine;
  /** What you get for it — in you, and in Azo's rooms. */
  reach: PhaseLine;
}

/**
 * The same opening on every plan's first step.
 *
 * It answers the two things someone hesitating is actually asking — does this
 * work, and is it going to be too much — before the plan asks them for
 * anything.
 */
const EASE_IN =
  'Everything in your plan comes from research on paced breathing, and the doses start low on purpose.';

const NUMBER_WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
] as const;

/** Small numbers read warmer as words; anything larger stays a numeral. */
function count(value: number): string {
  return NUMBER_WORDS[value] ?? String(value);
}

/**
 * How many of Azo's rooms are finished by the end of a step.
 *
 * A room is seven filled slots and a slot is one finished day, so a week of the
 * plan is a room. Nothing here needs building: it is the loop the app already
 * runs, said out loud on the screen where someone is deciding to start.
 */
function roomsBy(endWeek: number): string {
  return `${count(endWeek)} room${endWeek === 1 ? '' : 's'}`;
}

/** `two short resets that come to about 8 minutes across the day`. */
function dailyShape({ resetCount, fullMinutes }: PlanLadderContext): string {
  const resets = `${count(resetCount)} short reset${resetCount === 1 ? '' : 's'}`;
  return `You start with ${resets} that come to about ${fullMinutes} minutes across the day`;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const PHASE_COPY: Record<PresetId, readonly [PlanPhaseCopy, PlanPhaseCopy, PlanPhaseCopy]> = {
  night: [
    {
      detail: (context) =>
        `${EASE_IN} ${dailyShape(context)}, at the times you chose a moment ago.`,
      reach: () =>
        "Most people are dropping off faster by the end of the second week, and every day you complete puts another piece into Azo's room.",
    },
    {
      detail: () =>
        'Slow breathing at a fixed hour is what teaches the body to expect sleep, and by around the third week most people stop weighing up whether to do it at all.',
      reach: (_, meta) =>
        `By here the nights should be noticeably steadier, with fewer wakings and mornings that feel less like a fight, and Azo has ${count(meta.endWeek)} rooms filled from the days you have finished.`,
    },
    {
      detail: (_, meta) =>
        `${capitalize(count(meta.totalWeeks))} weeks of consistent practice is roughly where a paced wind-down stops being something you have added to the evening and starts being the thing that ends it.`,
      reach: (_, meta) =>
        `Expect to fall asleep faster than you did when you started, to wake rested more often than not, and a resting heart rate a little lower than the one you measured today. Azo finishes with ${roomsBy(meta.totalWeeks)}.`,
    },
  ],
  morning: [
    {
      detail: (context) =>
        `${EASE_IN} ${dailyShape(context)}, at the times you chose a moment ago.`,
      reach: () =>
        "The lift lands early, usually inside the first week, and every day you complete puts another piece into Azo's room.",
    },
    {
      detail: () =>
        'Faster paced breathing raises alertness and circulation within a few minutes, and once that lands at the same hour each day your body starts doing some of the waking up for you.',
      reach: (_, meta) =>
        `By here you should notice you are reaching for coffee later than you used to, and that the afternoon dip is shallower than it was, and Azo has ${count(meta.endWeek)} rooms filled.`,
    },
    {
      detail: (_, meta) =>
        `By ${count(meta.totalWeeks)} weeks the reset is less a thing you do in the morning than the way your morning opens, which is the point at which it stops needing willpower.`,
      reach: (_, meta) =>
        `Expect steadier energy across the whole day rather than a spike and a crash, and a way of starting that does not depend on how well you slept. Azo finishes with ${roomsBy(meta.totalWeeks)}.`,
    },
  ],
  pressure: [
    {
      detail: (context) =>
        `${EASE_IN} ${dailyShape(context)}, at the times you chose a moment ago.`,
      reach: () =>
        "Heart rate starts dropping inside the first minute of a reset, so you will feel something on day one, and every day you complete puts another piece into Azo's room.",
    },
    {
      detail: () =>
        'Around five minutes a day of slow breathing is where the research starts to show lower cortisol, and it works best when the hour is fixed rather than saved for the days that go badly.',
      reach: (_, meta) =>
        `By here you should be noticing real differences in your stress, a longer fuse on the difficult days and a quicker recovery once one has passed, and Azo has ${count(meta.endWeek)} rooms filled.`,
    },
    {
      detail: (_, meta) =>
        `After ${count(meta.totalWeeks)} weeks the reset is no longer something you remember to do. It is what you reach for when the day turns, which is the whole reason the hour was fixed in the first place.`,
      reach: (_, meta) =>
        `Expect a lower resting heart rate, less carried from one day into the next, and a way of bringing yourself down that works in a room full of people. Azo finishes with ${roomsBy(meta.totalWeeks)}.`,
    },
  ],
  focus: [
    {
      detail: (context) =>
        `${EASE_IN} ${dailyShape(context)}, at the times you chose a moment ago.`,
      reach: () =>
        "Starting gets easier within days rather than weeks, and every day you complete puts another piece into Azo's room.",
    },
    {
      detail: () =>
        'A short paced reset measurably sharpens attention, and lowering anxiety is what improves recall, so running one before you start does more than settle your nerves.',
      reach: (_, meta) =>
        `By here you should be holding focus for longer stretches, losing less of the afternoon, and finding that what you read actually stays put. Azo has ${count(meta.endWeek)} rooms filled.`,
    },
    {
      detail: (_, meta) =>
        `${capitalize(count(meta.totalWeeks))} weeks in, the reset is less a warm-up than the thing that gets you started at all, which matters more on the days you do not feel like starting.`,
      reach: (_, meta) =>
        `Expect to sit down to work without waiting to feel ready, to lose fewer hours to a wandering head, and to walk into exams or deadlines steadier. Azo finishes with ${roomsBy(meta.totalWeeks)}.`,
    },
  ],
  quiet: [
    {
      detail: (context) =>
        `${EASE_IN} ${dailyShape(context)}, at the times you chose a moment ago.`,
      reach: () =>
        "The first few will feel like time you have taken from something else, and every day you complete puts another piece into Azo's room.",
    },
    {
      detail: () =>
        'Slowing the breath is the oldest and best studied way into meditative focus, and after a fortnight of it at the same hour you stop having to justify the time to yourself.',
      reach: (_, meta) =>
        `By here the sitting should be going deeper and the guilt around taking it should be largely gone, and Azo has ${count(meta.endWeek)} rooms filled from the days you have finished.`,
    },
    {
      detail: (_, meta) =>
        `${capitalize(count(meta.totalWeeks))} weeks in, the sitting is not time you carve out of the day so much as a part of how the day is shaped.`,
      reach: (_, meta) =>
        `Expect a calmer baseline rather than a calm that only lasts the session, more patience with the people around you, and somewhere quiet you can reach at will. Azo finishes with ${roomsBy(meta.totalWeeks)}.`,
    },
  ],
};

/**
 * The published effect the plan rests on, said once under the goal.
 *
 * Deliberately a claim about slow breathing rather than about Azora's users: it
 * is the half that is defensible on the day the screen ships, and every line
 * here is one the goal screens already make, so the two screens agree rather
 * than quoting two different bodies of evidence at the same person.
 */
const PLAN_PROOF: Record<PresetId, string> = {
  night: 'Paced breathing before bed helps people fall asleep up to 37% faster.',
  morning: 'A few minutes of faster paced breathing raises alertness with no crash after it.',
  pressure: 'Five minutes a day of slow breathing cuts cortisol by up to 25%.',
  focus: 'A 90-second paced reset sharpens attention, and lower anxiety improves recall.',
  quiet: 'Slow, paced breathing is the best studied route into meditative focus.',
};

/** The evidence line for the plan this goal resolves to. */
export function planProofLine(intent: OnboardingIntent): string {
  return PLAN_PROOF[onboardingPresetFor(intent).id];
}


const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** `8 Oct`. Written by hand rather than through `Intl`, which Hermes trims. */
export function formatPlanDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export interface PlanPhase {
  name: string;
  detail: string;
  /** What you can do by the end of this step. */
  reach: string;
  startWeek: number;
  endWeek: number;
  /** `18 Sep – 1 Oct`, the calendar this step actually falls on. */
  dateRange: string;
}

export function planPhases(
  intent: OnboardingIntent,
  context: PlanLadderContext,
): PlanPhase[] {
  const preset = onboardingPresetFor(intent);
  const copy = PHASE_COPY[preset.id];

  let week = 1;
  return PHASE_NAMES.map((name, index) => {
    const startWeek = week;
    week += preset.phaseWeeks[index];
    const endWeek = week - 1;

    const meta = { endWeek, totalWeeks: preset.weeks };

    return {
      name,
      detail: copy[index].detail(context, meta),
      reach: copy[index].reach(context, meta),
      startWeek,
      endWeek,
      dateRange: `${formatPlanDate(addDays(context.startDate, (startWeek - 1) * 7))} \u2013 ${formatPlanDate(addDays(context.startDate, endWeek * 7 - 1))}`,
    };
  });
}

/** The day the plan finishes, for the line that states the whole promise. */
export function planGoalDate(
  intent: OnboardingIntent,
  startDate: Date,
): string {
  const { weeks } = onboardingPresetFor(intent);
  return formatPlanDate(addDays(startDate, weeks * 7 - 1));
}

/** `Weeks 1–2`, or `Week 4` when the phase is a single week. */
export function planPhaseWeeksLabel(phase: PlanPhase): string {
  return phase.startWeek === phase.endWeek
    ? `Week ${phase.startWeek}`
    : `Weeks ${phase.startWeek}\u2013${phase.endWeek}`;
}
