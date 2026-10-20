import {
  MOOD_SCALE_MAX,
  MOOD_SCALE_MIN,
} from '../../mood/domain/moodCheckIn';
import { MOOD_TAGS } from '../../mood/domain/moodTags';

export interface AnalyticsCheckIn {
  localDate: string;
  /** The stored 0–100 reading. */
  score: number;
  tags: string[];
  answers?: { overall?: number };
  feeling?: string | null;
  /** When the check-in was first saved; the hour it was answered. */
  createdAt?: string;
}

export interface AnalyticsActivityDay {
  activityDate: string;
  qualifiesForStreak: boolean;
}

/** A day rated at or above the middle of the scale. */
export const OKAY_OR_BETTER_LEVEL = 3;
/** Below this, a side of the comparison is an anecdote. */
export const MIN_DAYS_PER_SIDE = 5;
/** A tag needs this many days before it is allowed an opinion. */
export const MIN_DAYS_PER_TAG = 4;
/** A quarter point on the five-point scale filters very small differences. */
export const MIN_TAG_EFFECT = 0.25;
export interface InsightThresholds {
  minDaysPerSide: number;
  minDaysPerTag: number;
  minTagEffect: number;
  /** Check-ins needed before comparing tagged and other days. */
  minCheckInsForFactors: number;
}

export const DEFAULT_INSIGHT_THRESHOLDS: InsightThresholds = {
  minDaysPerSide: MIN_DAYS_PER_SIDE,
  minDaysPerTag: MIN_DAYS_PER_TAG,
  minTagEffect: MIN_TAG_EFFECT,
  minCheckInsForFactors: MIN_DAYS_PER_SIDE,
};

/**
 * Whatever the data supports, from the first day. The cards carry their own
 * day counts, so a small sample reads as small rather than being hidden.
 */
export const UNGATED_INSIGHT_THRESHOLDS: InsightThresholds = {
  minDaysPerSide: 1,
  minDaysPerTag: 1,
  minTagEffect: 0,
  minCheckInsForFactors: 2,
};

/** Three each way. A ranked list of twelve is a spreadsheet, not a finding. */
export const MAX_FACTORS_PER_SIDE = 3;

/** The stored 0–100 reading, back on the five points it was answered on. */
export function toScaleMean(score: number): number {
  return MOOD_SCALE_MIN + (score / 100) * (MOOD_SCALE_MAX - MOOD_SCALE_MIN);
}

/** Read the actual mood answer, including on historical multi-question rows. */
export function checkInMood(checkIn: {
  score: number;
  answers?: { overall?: number };
}): number {
  const overall = checkIn.answers?.overall;
  if (
    overall != null &&
    Number.isInteger(overall) &&
    overall >= MOOD_SCALE_MIN &&
    overall <= MOOD_SCALE_MAX
  ) {
    return overall;
  }
  return toScaleMean(checkIn.score);
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * The earliest date the activity fetch is allowed to speak for.
 *
 * Activity is read as a row limit rather than a date range, and check-ins are
 * read as their own separate limit. When the activity page comes back full it
 * may have been cut off partway through the user's history, and before its
 * oldest row "they did nothing that day" and "we did not look" are the same
 * absence. The split below would file every one of those days under the days
 * they did not Reset.
 *
 * Null when the page came back short, because that fetch reached the end of
 * the user's history and every absence inside it is a real one. A day somebody
 * checked in on before they ever did a Reset is exactly the evidence this
 * comparison is made of, and must not be clamped away.
 */
function comparableFrom(
  activity: AnalyticsActivityDay[],
  activityLimit: number,
): string | null {
  if (activity.length < activityLimit) return null;

  return activity.reduce<string | null>(
    (oldest, day) =>
      oldest == null || day.activityDate < oldest ? day.activityDate : oldest,
    null,
  );
}

export interface ResetEffect {
  /** Share of days rated okay or better, 0–1, on days a Reset was done. */
  keptShare: number;
  missedShare: number;
  keptDays: number;
  missedDays: number;
}

/**
 * How the days a Reset was done compare with the days one was not.
 *
 * The one comparison nobody else in this category can make: every other app
 * can only cross mood against a habit the user remembered to tag, and we know
 * whether the day was kept without asking.
 *
 * It reports a difference and never a cause, and it is perfectly capable of
 * reporting that the Reset days were worse. That is the price of it being
 * worth reading at all.
 */
export function resetEffect(
  checkIns: AnalyticsCheckIn[],
  activity: AnalyticsActivityDay[],
  /** How many activity rows were asked for, so truncation can be detected. */
  activityLimit: number,
  thresholds: InsightThresholds = DEFAULT_INSIGHT_THRESHOLDS,
): ResetEffect | null {
  const from = comparableFrom(activity, activityLimit);
  const keptDates = new Set(
    activity
      .filter((day) => day.qualifiesForStreak)
      .map((day) => day.activityDate),
  );

  const kept: number[] = [];
  const missed: number[] = [];

  for (const checkIn of checkIns) {
    if (from != null && checkIn.localDate < from) continue;

    const okay = checkInMood(checkIn) >= OKAY_OR_BETTER_LEVEL ? 1 : 0;
    if (keptDates.has(checkIn.localDate)) kept.push(okay);
    else missed.push(okay);
  }

  if (
    kept.length < thresholds.minDaysPerSide ||
    missed.length < thresholds.minDaysPerSide
  ) {
    return null;
  }

  return {
    keptShare: mean(kept),
    missedShare: mean(missed),
    keptDays: kept.length,
    missedDays: missed.length,
  };
}

export interface FactorEffect {
  tagId: string;
  label: string;
  /** The tag's own mean on the 1–5 scale. */
  tagMean: number;
  /** Difference between days with and without this tag. Signed. */
  effect: number;
  days: number;
  otherMean: number;
  otherDays: number;
  localDates: string[];
}

export interface FactorEffects {
  /** The user's average mood across all logged days. */
  baseline: number;
  better: FactorEffect[];
  harder: FactorEffect[];
}

/** Compare days with a tag to other logged days; this is an association, not a cause. */
export function factorEffects(
  checkIns: AnalyticsCheckIn[],
  thresholds: InsightThresholds = DEFAULT_INSIGHT_THRESHOLDS,
): FactorEffects | null {
  if (checkIns.length < thresholds.minCheckInsForFactors) return null;

  const baseline = mean(checkIns.map((checkIn) => checkInMood(checkIn)));
  const scored: FactorEffect[] = [];

  for (const tag of MOOD_TAGS) {
    const days = checkIns.filter((checkIn) => checkIn.tags.includes(tag.id));
    if (days.length < thresholds.minDaysPerTag) continue;

    const tagMean = mean(days.map((checkIn) => checkInMood(checkIn)));
    const otherDays = checkIns.filter((checkIn) => !checkIn.tags.includes(tag.id));
    if (otherDays.length < thresholds.minDaysPerTag) continue;
    const otherMean = mean(otherDays.map(checkInMood));
    const effect = tagMean - otherMean;
    if (effect === 0 || Math.abs(effect) < thresholds.minTagEffect) continue;

    scored.push({
      tagId: tag.id,
      label: tag.label,
      tagMean,
      effect,
      days: days.length,
      otherMean,
      otherDays: otherDays.length,
      localDates: days.map((day) => day.localDate).sort().reverse(),
    });
  }

  if (scored.length === 0) return null;

  const byStrength = (a: FactorEffect, b: FactorEffect) =>
    Math.abs(b.effect) - Math.abs(a.effect);

  return {
    baseline,
    better: scored
      .filter((factor) => factor.effect > 0)
      .sort(byStrength)
      .slice(0, MAX_FACTORS_PER_SIDE),
    harder: scored
      .filter((factor) => factor.effect < 0)
      .sort(byStrength)
      .slice(0, MAX_FACTORS_PER_SIDE),
  };
}

export interface MoodTrendPoint {
  localDate: string;
  /** The day's reading on the 1–5 scale, or null when it was not answered. */
  value: number | null;
}

/**
 * The last `days` days in order, oldest first, with the gaps left as gaps.
 *
 * A missing day is null rather than the last value carried forward or a
 * midpoint: a line drawn straight through a week nobody answered is the chart
 * inventing a calm fortnight, and the flat stretch would be the most
 * reassuring thing on it.
 */
export function moodTrend(
  checkIns: AnalyticsCheckIn[],
  todayLocalDate: string,
  days: number,
): MoodTrendPoint[] {
  const byDate = new Map(
    checkIns.map((checkIn) => [checkIn.localDate, checkInMood(checkIn)]),
  );
  const [year, month, day] = todayLocalDate.split('-').map(Number);
  const today = new Date(year, month - 1, day);
  const points: MoodTrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const localDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const score = byDate.get(localDate);

    points.push({
      localDate,
      value: score ?? null,
    });
  }

  return points;
}

/** Runs of consecutive answered days, which is what a line may be drawn over. */
export function moodTrendSegments(points: MoodTrendPoint[]): number[][] {
  const segments: number[][] = [];
  let current: number[] = [];

  points.forEach((point, index) => {
    if (point.value == null) {
      if (current.length > 0) segments.push(current);
      current = [];
      return;
    }
    current.push(index);
  });

  if (current.length > 0) segments.push(current);

  return segments;
}
