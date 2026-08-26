/**
 * Builds the personalized plan shown at the end of onboarding.
 *
 * The plan is three standing daily commitments — a primary guided breathing
 * session, a complementary hand-picked exercise, and a breath-hold check-in —
 * each at a fixed time. The exercises support the user's goals from different
 * angles, and the check-in is what produces the Day 7 re-test number.
 *
 * Seven days is the whole horizon because the trial is seven days: anything
 * that lands later is invisible to someone deciding whether to keep the app.
 */

import { estimateLungAge, MIN_LUNG_AGE } from './lungAge';
import {
  INTENT_TECHNIQUE,
  isOnboardingIntent,
  type OnboardingIntent,
} from '../features/exercise/guidedBreathing/techniqueSelection';
import type { TechniqueId } from '../features/exercise/guidedBreathing/techniqueCatalog';

export type PlanActionId = 'session' | 'handPicked' | 'checkIn';

export interface PlanAction {
  id: PlanActionId;
  title: string;
  /** Set for guided exercises; the check-in is not a guided technique. */
  techniqueId: TechniqueId | null;
  /** Minutes from midnight, so callers can format or schedule it. */
  minutesFromMidnight: number;
  minutes: number;
}

export interface PlanProjection {
  baselineSeconds: number;
  lowSeconds: number;
  highSeconds: number;
}

export type LungAgeGoal =
  | {
      mode: 'lower';
      currentYears: number;
      targetYears: number;
    }
  | {
      mode: 'maintain';
      currentYears: typeof MIN_LUNG_AGE;
      targetYears: typeof MIN_LUNG_AGE;
    };

export interface OnboardingPlan {
  actions: PlanAction[];
  /** The goal the plan was built around, so UI can speak in the user's terms. */
  intent: OnboardingIntent;
  projection: PlanProjection | null;
  lungAgeGoal: LungAgeGoal | null;
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
  breathHoldSeconds: number | null;
}

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_WAKE_MIN = 7 * 60;
const DEFAULT_SLEEP_MIN = 22 * 60;
const MORNING_MIN = 8 * 60;
const EVENING_MIN = 18 * 60;
const NIGHT_MIN = 21 * 60 + 30;
const WIND_DOWN_OFFSET_MINUTES = 30;

/** Goals whose session belongs at a specific point in the day. */
const MORNING_INTENTS = ['focus', 'energy'];
const NIGHT_INTENTS = ['sleep'];

const CHECK_IN_MINUTES = 1;
const MIN_SESSION_MINUTES = 2;
const MAX_SESSION_MINUTES = 10;

const HAND_PICKED_TECHNIQUE = {
  stress_relief: 'resonance',
  calm_fast: 'resonance',
  sleep: 'relaxing',
  focus: 'extended-exhale',
  energy: 'morning-charge',
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

/**
 * A conservative first-week range for a repeat static hold.
 *
 * Untrained holds improve quickly at first, mostly from CO2 tolerance and
 * technique rather than physiology, and the effect is proportional rather than
 * absolute. The range is set low enough that a user who actually practises
 * should clear it, because a projection they miss on Day 7 is worse than no
 * projection at all.
 */
export function projectHold(baselineSeconds: number): PlanProjection {
  const low = Math.max(baselineSeconds + 2, Math.round(baselineSeconds * 1.06));
  const high = Math.min(
    baselineSeconds + 20,
    Math.max(low + 3, Math.round(baselineSeconds * 1.16)),
  );
  return { baselineSeconds, lowSeconds: low, highSeconds: high };
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** The calendar day the Day 7 re-test lands on, counting today as Day 1. */
export function formatRetestDate(from: Date): string {
  const date = new Date(from.getTime());
  date.setDate(date.getDate() + 6);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
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
 * freshly built plan so the rest of the plan — techniques, durations,
 * projection — stays derived from their answers.
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
  // The check-in sits on the opposite end of the day from the primary session
  // so those commitments do not collapse into one combined block.
  const checkInAt = isMorningSession ? routine.windDownAt : routine.wakeAt;

  const actions = [
    {
      id: 'session',
      title: 'Guided breathing',
      techniqueId: INTENT_TECHNIQUE[intent],
      minutesFromMidnight: sessionAt,
      minutes,
    },
    {
      id: 'handPicked',
      title: 'Hand-picked reset',
      techniqueId: handPickedTechnique,
      minutesFromMidnight: routine.midpointAt,
      minutes: handPickedMinutes,
    },
    {
      id: 'checkIn',
      title: 'Azora Protocol',
      techniqueId: null,
      minutesFromMidnight: checkInAt,
      minutes: CHECK_IN_MINUTES,
    },
  ] satisfies PlanAction[];
  actions.sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);

  const projection =
    inputs.breathHoldSeconds != null && inputs.breathHoldSeconds > 0
      ? projectHold(Math.round(inputs.breathHoldSeconds))
      : null;
  let lungAgeGoal: LungAgeGoal | null = null;

  if (projection && inputs.breathHoldSeconds != null) {
    const currentYears = estimateLungAge(
      inputs.breathHoldSeconds,
      inputs.age,
    ).years;
    const targetYears = estimateLungAge(
      projection.highSeconds,
      inputs.age,
    ).years;

    if (targetYears < currentYears) {
      lungAgeGoal = { mode: 'lower', currentYears, targetYears };
    } else if (
      currentYears === MIN_LUNG_AGE &&
      targetYears === MIN_LUNG_AGE
    ) {
      lungAgeGoal = { mode: 'maintain', currentYears, targetYears };
    }
  }

  return {
    actions,
    intent,
    projection,
    lungAgeGoal,
    fullDailyMinutes: minutes + handPickedMinutes + CHECK_IN_MINUTES,
  };
}
