import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';
import {
  latestProgramPreset,
  programPresetWeeks,
  type ProgramPlanId,
} from '../features/program/domain/programCatalogue';
import { PLAN_TODO_STEP_ENABLED } from '../features/program/domain/programTodoStep';

/**
 * The plan the user is handed.
 *
 * They are told apart by what they contain, never by
 * their title: every one is the Life Reset Plan. See `PROGRAM_NAME`. What a goal
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
  self_acceptance: 'selfTrust',
  heart_health: 'pressure',
  cleaning: 'home',
  focus: 'focus',
  daily_habit: 'selfTrust',
  spiritual: 'quiet',
  self_care: 'quiet',
  yoga: 'quiet',
  // Says nothing about direction, so it gets the broadest territory.
  other: 'pressure',
};

/**
 * Signals collected during onboarding that can make a plan more specific than
 * the primary goal alone. They are intentionally limited to direct answers;
 * a mood, diagnosis, or general difficulty must not silently relabel a plan.
 */
export interface OnboardingPlanSignals {
  followUpAnswers?: Readonly<Record<string, readonly string[]>>;
  sleepCause?: 'phone' | null;
}

function hasFollowUpAnswer(
  answers: OnboardingPlanSignals['followUpAnswers'],
  questionId: string,
  answerId: string,
): boolean {
  return answers?.[questionId]?.includes(answerId) ?? false;
}

function planIdFor(
  intent: OnboardingIntent,
  signals: OnboardingPlanSignals,
): PresetId {
  if (intent === 'focus' && hasFollowUpAnswer(signals.followUpAnswers, 'when_focus', 'phone')) {
    return 'phone';
  }

  if (
    intent === 'sleep' &&
    (signals.sleepCause === 'phone' ||
      hasFollowUpAnswer(signals.followUpAnswers, 'when_sleep', 'phone'))
  ) {
    return 'phone';
  }

  if (intent === 'energy' && hasFollowUpAnswer(signals.followUpAnswers, 'when_energy', 'constant')) {
    return 'recovery';
  }

  return PRESET_FOR_INTENT[intent];
}

export function onboardingPresetFor(
  intent: OnboardingIntent,
  signals: OnboardingPlanSignals = {},
): OnboardingPreset {
  return presetForPlan(planIdFor(intent, signals));
}

function presetForPlan(planId: PresetId): OnboardingPreset {
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

/**
 * The plan a later screen should describe: the one they are enrolled in, or,
 * with no enrollment, the one their goal leads to.
 *
 * The goal alone is not enough once onboarding is over. Onboarding refines the
 * plan from follow-up answers that are not stored with the profile, so
 * rebuilding it from the goal can name a plan of a different length from the
 * one they were shown and enrolled in.
 */
export function enrolledOrGoalPreset(
  enrolledPlanId: PresetId | null | undefined,
  intent: OnboardingIntent,
): OnboardingPreset {
  return enrolledPlanId != null
    ? presetForPlan(enrolledPlanId)
    : onboardingPresetFor(intent);
}

export function planNameFor(intent: OnboardingIntent): string {
  return onboardingPresetFor(intent).name;
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
 * What you can do by the end of each phase, one line per card.
 *
 * Authored per plan rather than shared, because "the same reset, every day"
 * means a night for the Night plan and a session of work for the Focus one, and
 * one sentence cannot be true of both without being true of neither. Written
 * in the ads' voice: the problem they came in with, and the life after it.
 * Short enough to read at a glance, since the card carries the day.
 */
type PhaseReach = readonly [string, string, string];

const PHASE_REACH: Record<PresetId, PhaseReach> = {
  night: [
    'No more scrolling at 2am. Your nights start to calm down.',
    'Falling asleep stops being a fight. Mornings get lighter.',
    'You sleep through, wake rested, and feel like yourself again.',
  ],
  morning: [
    'Getting out of bed stops taking an hour of scrolling.',
    'No more afternoon crash. You have energy for your own life.',
    'You wake up ready, not already behind on everything.',
  ],
  pressure: [
    'The overwhelm stops running your whole day.',
    'Hard days stop sending you straight back to bed.',
    'Calm is your default now, not something you chase.',
  ],
  focus: [
    'Starting stops being the hardest part of your day.',
    'Your to-do list stops haunting you. Things get done.',
    'You sit down and just start. No motivation required.',
  ],
  quiet: [
    'Taking time for yourself stops feeling selfish.',
    'Your head gets quieter, even on the loud days.',
    'You have a calm place inside you, any time you need it.',
  ],
  home: [
    'The mess stops feeling like proof you are failing.',
    'Dishes, laundry, basic tasks: you just do them now.',
    'Your space feels like yours again, and so does your life.',
  ],
  phone: [
    'You feel the pull to scroll, and put the phone down.',
    'Hours stop disappearing into your phone.',
    'Your phone stops running your day. You do.',
  ],
  recovery: [
    'Low days stop turning into lost weeks.',
    'Even from bed, you have a way back into your day.',
    'Shutdown days get shorter, and you bounce back faster.',
  ],
  selfTrust: [
    'You stop calling yourself lazy. You never were.',
    'Falling off stops meaning starting over.',
    'You trust yourself to follow through again.',
  ],
};

/**
 * Heart-health phase lines. Same exercises and timing as the pressure plan,
 * told in terms of the heart rather than stress.
 */
const HEART_HEALTH_PHASE_REACH: PhaseReach = [
  'Your body calms down within a minute of each exercise.',
  'Stress stops living in your chest all day.',
  'A calmer heart, and a calmer you, every day.',
];

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
  focus: 'Research finds a 90-second paced breathing exercise sharpens attention, and that lower anxiety improves recall.',
  quiet: 'In the research, slow paced breathing is the best studied route into meditative focus.',
  home: 'A short breathing exercise creates a calmer pause before a hard next step.',
  phone: 'Slow breathing gives attention a quieter place to land when the urge to scroll appears.',
  recovery: 'Research on paced breathing supports it as a short, accessible way to settle the body.',
  selfTrust: 'Slow paced breathing helps create the pause needed to notice and choose a response.',
};

const HEART_HEALTH_PROOF =
  'Studies find five minutes a day of coherent breathing raises heart rate variability and lowers resting heart rate within eight weeks.';

/** The evidence line for the plan this goal resolves to. */
export function planProofLine(intent: OnboardingIntent): string {
  if (intent === 'heart_health') return HEART_HEALTH_PROOF;
  return PLAN_PROOF[onboardingPresetFor(intent).id];
}

/** The evidence line for a plan that was refined by a direct onboarding answer. */
export function planProofLineForPreset(
  preset: OnboardingPreset,
  intent: OnboardingIntent,
): string {
  if (intent === 'heart_health') return HEART_HEALTH_PROOF;
  return PLAN_PROOF[preset.id];
}


export interface PlanPhase {
  name: string;
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
  if (intent === 'heart_health') {
    return planPhasesWithReach('pressure', HEART_HEALTH_PHASE_REACH);
  }
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
  return planPhasesWithReach(planId, PHASE_REACH[planId]);
}

function planPhasesWithReach(planId: PresetId, reach: PhaseReach): PlanPhase[] {
  return phaseBoundsForPlan(planId).map(({ name, startWeek, endWeek }, index) => ({
    name,
    reach: reach[index],
    startWeek,
    endWeek,
  }));
}

/** The first card of the journey: the plan's real first day, not a promise. */
export function planFirstDayLine(planId: PresetId): string {
  const published = latestProgramPreset(planId);
  if (published == null) {
    throw new Error(`No published program plan for ${planId}`);
  }
  const firstExerciseDay = published.days.find((day) => day.activityIds.length > 0)?.day;
  const steps = ['a check-in', 'one short lesson'];
  if (firstExerciseDay === 1) steps.push('a short guided exercise');
  if (PLAN_TODO_STEP_ENABLED) steps.push('one to-do');
  const firstDay = `Day 1 is ${steps.slice(0, -1).join(', ')} and ${steps.at(-1)}.`;
  return firstExerciseDay === 1
    ? firstDay
    : `${firstDay} Your first guided exercise is on day ${firstExerciseDay}.`;
}

/** A day on the plan's journey, and what is true by then. */
export interface PlanJourneyDay {
  day: number;
  line: string;
}

/** The first week, where most habits are won or lost, gets its own stops. */
const EARLY_DAYS: readonly PlanJourneyDay[] = [
  {
    day: 3,
    line: 'You are not lazy. Three days in, and you keep showing up.',
  },
  {
    day: 7,
    line: 'A whole week of tiny steps. Momentum, not motivation.',
  },
];

/**
 * Day one, the early stops, then the end of every phase, in order. A phase
 * that ends on an early stop's day keeps the day, since its line is the plan's
 * own.
 */
export function planJourney(planId: PresetId): PlanJourneyDay[] {
  const phaseDays = planPhasesForPlan(planId).map((phase) => ({
    day: phase.endWeek * DAYS_PER_WEEK,
    line: phase.reach,
  }));
  const early = EARLY_DAYS.filter(
    ({ day }) => !phaseDays.some((phase) => phase.day === day),
  );
  const first = { day: 1, line: planFirstDayLine(planId) };
  return [first, ...early, ...phaseDays].sort(
    (a, b) => a.day - b.day,
  );
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

/** What the plan promises, in the catalogue's own words. */
export function planOutcome(planId: PresetId): string {
  const published = latestProgramPreset(planId);
  if (published == null) {
    throw new Error(`No published program plan for ${planId}`);
  }
  return published.outcome;
}

/**
 * The day the plan finishes, counting today as day one, always said with the
 * condition that earns it. The plan waits when a day is missed, so the bare
 * date would promise a day it cannot hold to.
 */
export function planFinishLine(preset: OnboardingPreset, today: Date): string {
  const days = preset.weeks * DAYS_PER_WEEK;
  const finish = new Date(today);
  finish.setDate(finish.getDate() + days - 1);
  const date = finish.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${days} days, one step a day. You finish on ${date}.`;
}
