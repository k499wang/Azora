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

export type PlanActionId = 'session' | 'checkIn';

export interface PlanAction {
  id: PlanActionId;
  title: string;
  /** Set for the breathing session; the check-in is not a guided technique. */
  techniqueId: string | null;
  /** Minutes from midnight, so callers can format or schedule it. */
  minutesFromMidnight: number;
  minutes: number;
}

export interface PlanProjection {
  baselineSeconds: number;
  lowSeconds: number;
  highSeconds: number;
}

export interface OnboardingPlan {
  actions: PlanAction[];
  projection: PlanProjection | null;
  heartRateNote: string | null;
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
  /** Average BPM from the baseline read. */
  avgBpm: number | null;
}

const INTENT_TECHNIQUE: Record<string, string> = {
  stress_relief: 'relaxing',
  calm_fast: 'relaxing',
  focus: 'box',
  energy: 'box',
  spiritual: 'resonance',
  sleep: '478',
  heart_health: 'resonance',
  daily_habit: 'box',
  yoga: 'resonance',
  other: 'box',
};

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

function primaryIntent(intents: string[]): string {
  return intents.find((intent) => INTENT_TECHNIQUE[intent]) ?? 'other';
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
      techniqueId: INTENT_TECHNIQUE[intent] ?? 'box',
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

  return {
    actions,
    projection:
      inputs.breathHoldSeconds != null && inputs.breathHoldSeconds > 0
        ? projectHold(Math.round(inputs.breathHoldSeconds))
        : null,
    heartRateNote:
      inputs.avgBpm != null
        ? `Your measured heart rate: ${Math.round(inputs.avgBpm)} BPM.`
        : null,
    fullDailyMinutes: minutes + CHECK_IN_MINUTES,
  };
}
