/**
 * The hours the plan runs at, chosen from the user's routine.
 *
 * What the plan *contains* is authored in `programCatalogue.ts` and no longer
 * decided here: a day is one exercise in week one and three by the last, and
 * the catalogue names every one of them. What is still decided here is when —
 * a session hour placed from the goal and the sleep answers, and a midday hour
 * halfway through the waking day.
 *
 * The techniques below are what a user with no plan falls back to, and what the
 * assessment's recommendation is read from.
 */

import {
  INTENT_TECHNIQUE,
  isOnboardingIntent,
  type OnboardingIntent,
} from '../features/exercise/guidedBreathing/techniqueSelection';
import type { TechniqueId } from '../features/exercise/guidedBreathing/techniqueCatalog';

export type PlanActionId = 'session' | 'handPicked';

export interface PlanAction {
  id: PlanActionId;
  techniqueId: TechniqueId;
  /** Minutes from midnight, so callers can format or schedule it. */
  minutesFromMidnight: number;
  minutes: number;
  /**
   * The answer this action was chosen from, ready to sit under its title.
   * Null when nothing the user said explains it.
   */
  because: string | null;
}

export interface OnboardingPlan {
  actions: PlanAction[];
  /** The goal the plan was built around, so UI can speak in the user's terms. */
  intent: OnboardingIntent;
  fullDailyMinutes: number;
}

export interface PlanInputs {
  intents: string[];
  /** 1–10, higher is more stressed. */
  stressLevel: number;
  /** 1–10, higher is better sleep. */
  sleepQuality: number;
  age: number;
  dailyMinutes: number;
  /** User's usual wake time, in minutes from midnight. */
  wakeTimeMinutes: number;
  /** User's usual sleep time, in minutes from midnight. */
  sleepTimeMinutes: number;
  /**
   * Their own words for when the problem hits.
   *
   * Resolved by the caller rather than looked up here: the fragment is authored
   * next to the option it belongs to, and this module has no business importing
   * onboarding question data to find it.
   */
  whenEcho?: string | null;
}

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_WAKE_MIN = 7 * 60;
const DEFAULT_SLEEP_MIN = 22 * 60;
/** The two ends of the day a reset can be pinned to when the user names one. */
export const PLAN_MORNING_MIN = 8 * 60;
export const PLAN_EVENING_MIN = 18 * 60;
const MORNING_MIN = PLAN_MORNING_MIN;
const EVENING_MIN = PLAN_EVENING_MIN;
const NIGHT_MIN = 21 * 60 + 30;
const WIND_DOWN_OFFSET_MINUTES = 30;

/** Goals whose session belongs at a specific point in the day. */
const MORNING_INTENTS = ['focus', 'energy'];
const NIGHT_INTENTS = ['sleep'];

const MIN_SESSION_MINUTES = 2;
const MAX_SESSION_MINUTES = 10;

const HAND_PICKED_TECHNIQUE = {
  stress_relief: 'resonance',
  calm_fast: 'resonance',
  sleep: 'relaxing',
  focus: 'extended-exhale',
  energy: 'morning-charge',
  self_acceptance: 'coherent-6',
  emotional_balance: 'resonance',
  self_care: 'belly',
  spiritual: 'coherent-6',
  yoga: 'belly',
  heart_health: 'coherent-6',
  daily_habit: 'belly',
  other: 'belly',
} as const satisfies Record<OnboardingIntent, TechniqueId>;

type HandPickedTechniqueId = (typeof HAND_PICKED_TECHNIQUE)[OnboardingIntent];

/** Display durations for the techniques used as complementary exercises. */
const HAND_PICKED_MINUTES: Record<HandPickedTechniqueId, number> = {
  resonance: 2,
  relaxing: 1,
  'extended-exhale': 2,
  'morning-charge': 2,
  'coherent-6': 2,
  belly: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function primaryIntent(intents: string[]): OnboardingIntent {
  return intents.find(isOnboardingIntent) ?? 'other';
}

function sessionMinutes(dailyMinutes: number): number {
  return clamp(Math.round(dailyMinutes), MIN_SESSION_MINUTES, MAX_SESSION_MINUTES);
}

function normalizeTime(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return ((Math.round(value) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

interface RoutineSchedule {
  wakeAt: number;
  windDownAt: number;
  midpointAt: number;
  awakeMinutes: number;
}

function routineSchedule(wakeInput: number, sleepInput: number): RoutineSchedule {
  let wakeAt = normalizeTime(wakeInput);
  let sleepAt = normalizeTime(sleepInput);

  if (wakeAt == null || sleepAt == null || wakeAt === sleepAt) {
    wakeAt = DEFAULT_WAKE_MIN;
    sleepAt = DEFAULT_SLEEP_MIN;
  }

  const awakeMinutes = (sleepAt - wakeAt + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const windDownOffset = Math.max(0, awakeMinutes - WIND_DOWN_OFFSET_MINUTES);

  return {
    wakeAt,
    windDownAt: (wakeAt + windDownOffset) % MINUTES_PER_DAY,
    midpointAt: (wakeAt + Math.round(awakeMinutes / 2)) % MINUTES_PER_DAY,
    awakeMinutes,
  };
}

function clampToAwakeWindow(preferred: number, routine: RoutineSchedule): number {
  const elapsed = (preferred - routine.wakeAt + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  if (elapsed <= routine.awakeMinutes) return preferred;
  return routine.windDownAt;
}

export function sessionTimeFor(intents: string[], sleepQuality: number): number {
  if (intents.some((intent) => NIGHT_INTENTS.includes(intent))) return NIGHT_MIN;
  if (intents.some((intent) => MORNING_INTENTS.includes(intent))) return MORNING_MIN;
  // Poor sleepers get the session late enough to double as a wind-down.
  return sleepQuality <= 4 ? NIGHT_MIN : EVENING_MIN;
}

export function formatPlanTime(minutesFromMidnight: number): string {
  const total = ((Math.round(minutesFromMidnight) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const suffix = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/**
 * Where a plan action sits in the day, in the user's own terms.
 *
 * Derived from the clock time rather than the goal that produced it, so the
 * label still reads true after the user moves an action to a time of their own.
 */
export function planTimeOfDayLabel(minutesFromMidnight: number): string {
  const total = ((Math.round(minutesFromMidnight) % (24 * 60)) + 24 * 60) % (24 * 60);

  if (total < 5 * 60) return 'Late night';
  if (total < 11 * 60) return 'When you wake up';
  if (total < 14 * 60) return 'Around midday';
  if (total < 18 * 60) return 'Afternoon';
  if (total < 21 * 60) return 'Evening';
  return 'Before you sleep';
}

/** 24-hour `HH:MM`, the shape the notification preferences store. */
export function toClockString(minutesFromMidnight: number): string {
  const total = ((Math.round(minutesFromMidnight) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Parses 24-hour `HH:MM`; null when the value is not a valid clock time. */
export function fromClockString(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (match == null) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Times the user picked for themselves on the plan screen. Applied on top of a
 * freshly built plan so the rest of the plan — techniques and durations —
 * stays derived from their answers.
 */
export type PlanTimeOverrides = Partial<Record<PlanActionId, number>>;

export function applyPlanTimeOverrides(
  plan: OnboardingPlan,
  overrides: PlanTimeOverrides,
): OnboardingPlan {
  const actions = plan.actions
    .map((action) => {
      const override = overrides[action.id];
      return override == null
        ? action
        : { ...action, minutesFromMidnight: override };
    })
    .sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);

  return { ...plan, actions };
}

export function buildOnboardingPlan(inputs: PlanInputs): OnboardingPlan {
  const minutes = sessionMinutes(inputs.dailyMinutes);
  const intent = primaryIntent(inputs.intents);
  const routine = routineSchedule(inputs.wakeTimeMinutes, inputs.sleepTimeMinutes);
  const isMorningSession = MORNING_INTENTS.includes(intent);
  const isWindDownSession =
    NIGHT_INTENTS.includes(intent) || inputs.sleepQuality <= 4;
  const sessionAt = isMorningSession
    ? routine.wakeAt
    : isWindDownSession
      ? routine.windDownAt
      : clampToAwakeWindow(EVENING_MIN, routine);
  const handPickedTechnique = HAND_PICKED_TECHNIQUE[intent];
  const handPickedMinutes = HAND_PICKED_MINUTES[handPickedTechnique];

  const actions = [
    {
      id: 'session',
      techniqueId: INTENT_TECHNIQUE[intent],
      minutesFromMidnight: sessionAt,
      minutes,
      because: inputs.whenEcho ? `because you said ${inputs.whenEcho}` : null,
    },
    {
      id: 'handPicked',
      techniqueId: handPickedTechnique,
      minutesFromMidnight: routine.midpointAt,
      minutes: handPickedMinutes,
      // Chosen from the goal alone, and the goal already explains a to-do line
      // further down the same page. Saying it twice is what turns citing an
      // answer into a parlour trick, so the weaker instance stays silent.
      because: null,
    },
  ] satisfies PlanAction[];
  actions.sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);

  return {
    actions,
    intent,
    fullDailyMinutes: minutes + handPickedMinutes,
  };
}
