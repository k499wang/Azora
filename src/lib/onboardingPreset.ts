import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';
import {
  latestProgramPreset,
  programPlanShape,
  programPresetWeeks,
  type ProgramPlanId,
  type ProgramPlanShape,
} from '../features/program/domain/programCatalogue';

/**
 * The plan the user is handed.
 *
 * There are five of them and they are told apart by what they contain, never by
 * their title: every one is the Azora Protocol. See `PROGRAM_NAME`. What a goal
 * chooses here is a territory of content — the techniques, the length, the order
 * — and the name the user reads is the same either way.
 */
export type PresetId = ProgramPlanId;

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

const DAYS_PER_WEEK = 7;

/**
 * How many weeks each phase of a plan runs.
 *
 * Read from the authored catalogue rather than kept beside it. The plan's real
 * length and its real phase boundaries live in `programCatalogue.ts`, and a
 * second copy here is a copy that drifts: the day someone re-authors a plan,
 * onboarding would promise a shape the plan no longer has.
 */
function phaseWeeksFor(planId: ProgramPlanId): readonly [number, number, number] {
  const published = latestProgramPreset(planId);
  if (published == null) {
    throw new Error(`No published program plan for ${planId}`);
  }

  const weeks = published.phases.map((phase) => {
    const days = phase.endDay - phase.startDay + 1;
    if (days % DAYS_PER_WEEK !== 0) {
      throw new Error(
        `${planId} phase "${phase.name}" is not a whole number of weeks`,
      );
    }
    return days / DAYS_PER_WEEK;
  });

  if (weeks.length !== 3) {
    throw new Error(`${planId} does not run the three named phases`);
  }

  return [weeks[0], weeks[1], weeks[2]];
}

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


export function onboardingPresetFor(intent: OnboardingIntent): OnboardingPreset {
  const planId = PRESET_FOR_INTENT[intent];
  const published = latestProgramPreset(planId);
  if (published == null) {
    throw new Error(`No published program plan for ${planId}`);
  }

  return {
    id: planId,
    name: published.name,
    weeks: programPresetWeeks(published),
    phaseWeeks: phaseWeeksFor(planId),
  };
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
  /**
   * What the plan actually asks for, read from the plan.
   *
   * The ladder used to be handed a reset count and a daily total by whichever
   * screen drew it, and both were built from the session length the user picked
   * at the start of onboarding. Neither has been true since the plan started
   * authoring its own days: day one is one short reset of a fixed length, and
   * the day grows by adding another rather than by running longer.
   */
  shape: ProgramPlanShape;
}

type PhaseLine = (meta: PhaseMeta) => string;

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
  'Everything starts small on purpose. Short sessions, easy to keep, so the habit lands before the motivation fades.';

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

/**
 * What the day is, in the numbers the plan actually runs on.
 *
 * Present tense, and only this stretch. The rung used to go on to say which
 * week a second reset joins and which week a third does, and that is a promise
 * about a day the user has not reached: it puts the work in front of them
 * before the habit that carries it exists, and it makes week one read as a
 * warm-up for something else rather than as the thing they are doing.
 */
function dailyShape({ shape }: PhaseMeta): string {
  const one = shape.firstDayCount === 1;
  const resets = `${count(shape.firstDayCount)} short reset${one ? '' : 's'}`;
  const variety = one ? 'a different one each day' : 'a different set each day';
  return `Your day is ${resets} of about ${shape.firstDayMinutes} minutes, at the time${one ? '' : 's'} you picked, and ${variety}.`;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** The whole of the first rung's body, shared by every plan. */
function easeIn(meta: PhaseMeta): string {
  return `${EASE_IN} ${dailyShape(meta)}`;
}

const PHASE_COPY: Record<PresetId, readonly [PlanPhaseCopy, PlanPhaseCopy, PlanPhaseCopy]> = {
  night: [
    {
      detail: (meta) => easeIn(meta),
      reach: () =>
        "Most people notice a difference by the end of the second week, and every day you finish builds the next one.",
    },
    {
      detail: () =>
        'The wind-down reset is made for the hour before bed, not borrowed from somewhere else. Slow breathing at the same time each night teaches your body to expect sleep, and by now most people stop wondering whether they feel like it.',
      reach: (meta) =>
        `By here the nights should feel steadier. Fewer wakings, mornings that are less of a fight, and ${count(meta.endWeek)} rooms filled from the days you have finished.`,
    },
    {
      detail: (meta) =>
        `${capitalize(count(meta.totalWeeks))} weeks in, the wind-down stops being something you do before bed and becomes the thing that ends your day.`,
      reach: (meta) =>
        `Expect to fall asleep faster, to wake rested more often than not, and a resting heart rate a little lower than the one you measured today. ${roomsBy(meta.totalWeeks)} filled.`,
    },
  ],
  morning: [
    {
      detail: (meta) => easeIn(meta),
      reach: () =>
        "The lift lands early, usually inside the first week, and every day you finish builds the next one.",
    },
    {
      detail: () =>
        'The morning reset runs faster and shorter than the others. It is meant to wake you up, not settle you. That faster pace raises alertness within a few minutes, and once it lands at the same hour each day your body starts doing some of the waking up for you.',
      reach: (meta) =>
        `By here you should notice you are reaching for coffee later, and that the afternoon dip is shallower than it was. ${count(meta.endWeek)} rooms filled.`,
    },
    {
      detail: (meta) =>
        `By ${count(meta.totalWeeks)} weeks the reset is less a thing you do in the morning than the way your morning opens, which is the point where it stops needing willpower.`,
      reach: (meta) =>
        `Expect steadier energy across the whole day rather than a spike and a crash, and a way of starting that does not depend on how well you slept. ${roomsBy(meta.totalWeeks)} filled.`,
    },
  ],
  pressure: [
    {
      detail: (meta) => easeIn(meta),
      reach: () =>
        "Heart rate drops inside the first minute of a reset, so you will feel something on day one, and every day you finish builds the next one.",
    },
    {
      detail: () =>
        'One of them is a cooling reset, for the days that run hot rather than fast. Five minutes a day of slow breathing is where the research lands, and it works best when the hour is fixed, not saved for the days that go badly.',
      reach: (meta) =>
        `By here you should be noticing real differences in your stress. A longer fuse on the hard days, a quicker recovery once one has passed, and ${count(meta.endWeek)} rooms filled.`,
    },
    {
      detail: (meta) =>
        `After ${count(meta.totalWeeks)} weeks the reset is no longer something you remember to do. It is what you reach for when the day turns, which is the whole reason the hour was fixed in the first place.`,
      reach: (meta) =>
        `Expect a lower resting heart rate, less carried from one day into the next, and a way of bringing yourself down that works in a room full of people. ${roomsBy(meta.totalWeeks)} filled.`,
    },
  ],
  focus: [
    {
      detail: (meta) => easeIn(meta),
      reach: () =>
        "Starting gets easier within days rather than weeks, and every day you finish builds the next one.",
    },
    {
      detail: () =>
        'This is the stretch where focus starts holding past the session itself. A short paced reset sharpens attention fast, and lowering anxiety is what improves recall, so running one before you start does more than settle your nerves.',
      reach: (meta) =>
        `By here you should be holding focus for longer stretches, losing less of the afternoon, and finding that what you read actually stays put. ${count(meta.endWeek)} rooms filled.`,
    },
    {
      detail: (meta) =>
        `${capitalize(count(meta.totalWeeks))} weeks in, the reset is less a warm-up than the thing that gets you started at all, which matters more on the days you do not feel like starting.`,
      reach: (meta) =>
        `Expect to sit down to work without waiting to feel ready, to lose fewer hours to a wandering head, and to walk into exams or deadlines steadier. ${roomsBy(meta.totalWeeks)} filled.`,
    },
  ],
  quiet: [
    {
      detail: (meta) => easeIn(meta),
      reach: () =>
        "The first few will feel like time taken from something else, and every day you finish builds the next one.",
    },
    {
      detail: () =>
        'The longest exercise of the day runs to eight minutes here. Slowing the breath is the oldest way into meditative focus, and after a fortnight at the same hour you stop having to justify the time to yourself.',
      reach: (meta) =>
        `By here the exercise should be going deeper and the guilt around taking it should be largely gone. ${count(meta.endWeek)} rooms filled from the days you have finished.`,
    },
    {
      detail: (meta) =>
        `${capitalize(count(meta.totalWeeks))} weeks in, the exercise is not time you carve out of the day so much as a part of how the day is shaped.`,
      reach: (meta) =>
        `Expect a calmer baseline rather than a calm that only lasts the session, more patience with the people around you, and somewhere quiet you can reach at will. ${roomsBy(meta.totalWeeks)} filled.`,
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
 *
 * Each line names the research as the thing making the claim. A number that
 * arrives unattributed on a plan screen reads as a promise about the plan, and
 * none of these are measured by this app.
 */
const PLAN_PROOF: Record<PresetId, string> = {
  night: 'In the research, paced breathing before bed helps people fall asleep up to 37% faster.',
  morning: 'Studies find a few minutes of faster paced breathing raises alertness, with no crash after.',
  pressure: 'Trials of five minutes a day of slow breathing show cortisol down by up to 25%.',
  focus: 'Research finds a 90-second paced reset sharpens attention, and that lower anxiety improves recall.',
  quiet: 'In the research, slow paced breathing is the best studied route into meditative focus.',
};

/** The evidence line for the plan this goal resolves to. */
export function planProofLine(intent: OnboardingIntent): string {
  return PLAN_PROOF[onboardingPresetFor(intent).id];
}


export interface PlanPhase {
  name: string;
  detail: string;
  /** What you can do by the end of this step. */
  reach: string;
  startWeek: number;
  endWeek: number;
}

/** A phase's name and the weeks it covers, with none of the authored copy. */
export interface PlanPhaseBound {
  name: string;
  startWeek: number;
  endWeek: number;
}

/**
 * Where each phase starts and ends, without the copy.
 *
 * The ladder needs the interpolated sentences; Home needs only which phase a
 * week falls in. Both read the bounds from here so the screen that names the
 * phase and the screen that describes it can never disagree about where it
 * begins.
 */
export function planPhaseBounds(intent: OnboardingIntent): PlanPhaseBound[] {
  return phaseBoundsForPlan(onboardingPresetFor(intent).id);
}

export function phaseBoundsForPlan(planId: PresetId): PlanPhaseBound[] {
  const phaseWeeks = phaseWeeksFor(planId);

  let week = 1;
  return PHASE_NAMES.map((name, index) => {
    const startWeek = week;
    week += phaseWeeks[index];
    return { name, startWeek, endWeek: week - 1 };
  });
}

export function planPhases(intent: OnboardingIntent): PlanPhase[] {
  return planPhasesForPlan(onboardingPresetFor(intent).id);
}

/**
 * The ladder for a plan the user is already on.
 *
 * Onboarding knows a goal and resolves a plan from it; a running enrollment
 * knows the plan itself and has no goal to go back through. Both need the same
 * rungs, so the copy is looked up by plan rather than re-derived from an answer
 * the enrollment never stored.
 */
export function planPhasesForPlan(planId: PresetId): PlanPhase[] {
  const published = latestProgramPreset(planId);
  if (published == null) {
    throw new Error(`No published program plan for ${planId}`);
  }
  const preset = { id: planId, weeks: programPresetWeeks(published) };
  const copy = PHASE_COPY[planId];

  const shape = programPlanShape(published);

  return phaseBoundsForPlan(planId).map(({ name, startWeek, endWeek }, index) => {
    const meta = { endWeek, totalWeeks: preset.weeks, shape };

    return {
      name,
      detail: copy[index].detail(meta),
      reach: copy[index].reach(meta),
      startWeek,
      endWeek,
    };
  });
}

/**
 * How many finished days the plan is, for the line that states the whole
 * promise.
 *
 * Days rather than a date. The plan waits when a day is missed, so a calendar
 * would be promising a day it cannot hold to — and the screen says as much a
 * few lines further down.
 */
export function planGoalDays(intent: OnboardingIntent): number {
  return onboardingPresetFor(intent).weeks * DAYS_PER_WEEK;
}

/** `Weeks 1–2`, or `Week 4` when the phase is a single week. */
export function planPhaseWeeksLabel(phase: PlanPhase): string {
  return phase.startWeek === phase.endWeek
    ? `Week ${phase.startWeek}`
    : `Weeks ${phase.startWeek}\u2013${phase.endWeek}`;
}
