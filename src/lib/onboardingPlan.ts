/**
 * Builds the personalized plan shown at the end of onboarding.
 *
 * The plan is two standing daily commitments — one guided breathing session and
 * one breath-hold check-in — each at a fixed time. Two anchors rather than one
 * gives the habit a second chance to land on a day the first is missed, and the
 * check-in is what produces the Day 7 re-test number.
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

export type PlanActionId = 'session' | 'checkIn';

export interface PlanAction {
  id: PlanActionId;
  title: string;
  /** Set for the breathing session; the check-in is not a guided technique. */
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
  breathHoldSeconds: number | null;
}

const MORNING_MIN = 8 * 60;
const EVENING_MIN = 18 * 60;
const NIGHT_MIN = 21 * 60 + 30;

/** Goals whose session belongs at a specific point in the day. */
const MORNING_INTENTS = ['focus', 'energy'];
const NIGHT_INTENTS = ['sleep'];

const CHECK_IN_MINUTES = 1;
const MIN_SESSION_MINUTES = 2;
const MAX_SESSION_MINUTES = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function primaryIntent(intents: string[]): OnboardingIntent {
  return intents.find(isOnboardingIntent) ?? 'other';
}

function sessionMinutes(dailyMinutes: number): number {
  return clamp(Math.round(dailyMinutes), MIN_SESSION_MINUTES, MAX_SESSION_MINUTES);
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

/** 24-hour `HH:MM`, the shape the notification preferences store. */
export function toClockString(minutesFromMidnight: number): string {
  const total = ((Math.round(minutesFromMidnight) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function buildOnboardingPlan(inputs: PlanInputs): OnboardingPlan {
  const minutes = sessionMinutes(inputs.dailyMinutes);
  const intent = primaryIntent(inputs.intents);
  const sessionAt = sessionTimeFor(inputs.intents, inputs.sleepQuality);
  // The check-in sits on the opposite end of the day from the session so the
  // plan has two separate anchors rather than one combined block.
  const checkInAt = sessionAt < 12 * 60 ? EVENING_MIN : MORNING_MIN;

  const actions = [
    {
      id: 'session',
      title: 'Guided breathing',
      techniqueId: INTENT_TECHNIQUE[intent],
      minutesFromMidnight: sessionAt,
      minutes,
    },
    {
      id: 'checkIn',
      title: 'Breath-hold check-in',
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
    projection,
    lungAgeGoal,
    fullDailyMinutes: minutes + CHECK_IN_MINUTES,
  };
}
