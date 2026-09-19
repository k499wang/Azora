/**
 * The two findings worth printing, from the check-ins and the days kept.
 *
 * Findings, not counts. "How was last week" is a dashboard; "your days go
 * better when you Reset" and "your hard days are work days" are answers to
 * questions somebody would actually ask. Both are the shape every analytics
 * feature in this category is praised for, and both are only possible because
 * the check-in carries tags.
 *
 * Everything here refuses to speak on thin data. A correlation drawn from two
 * days is noise wearing a decimal point, and the first one a user sees is what
 * decides whether they ever trust the rest.
 */

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
/** Half a point on the five-point scale: smaller is not worth a sentence. */
export const MIN_TAG_EFFECT = 0.25;
/** Three each way. A ranked list of twelve is a spreadsheet, not a finding. */
export const MAX_FACTORS_PER_SIDE = 3;

/** The stored 0–100 reading, back on the five points it was answered on. */
export function toScaleMean(score: number): number {
  return MOOD_SCALE_MIN + (score / 100) * (MOOD_SCALE_MAX - MOOD_SCALE_MIN);
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

    const okay = toScaleMean(checkIn.score) >= OKAY_OR_BETTER_LEVEL ? 1 : 0;
    if (keptDates.has(checkIn.localDate)) kept.push(okay);
    else missed.push(okay);
  }

  if (kept.length < MIN_DAYS_PER_SIDE || missed.length < MIN_DAYS_PER_SIDE) {
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
  /** How far that sits from the user's own baseline. Signed. */
  effect: number;
  days: number;
}

export interface FactorEffects {
  /** The user's own average day, which every effect is measured against. */
  baseline: number;
  better: FactorEffect[];
  harder: FactorEffect[];
}

/**
 * Which tagged days run above the user's own average, and which run below.
 *
 * Measured against *their* baseline rather than the scale's midpoint: a person
 * whose ordinary day is a 4 and a person whose ordinary day is a 2 both want
 * to know what moves them, and the midpoint would only tell them which of the
 * two they are.
 */
export function factorEffects(
  checkIns: AnalyticsCheckIn[],
): FactorEffects | null {
  if (checkIns.length < MIN_DAYS_PER_SIDE) return null;

  const baseline = mean(checkIns.map((checkIn) => toScaleMean(checkIn.score)));
  const scored: FactorEffect[] = [];

  for (const tag of MOOD_TAGS) {
    const days = checkIns.filter((checkIn) => checkIn.tags.includes(tag.id));
    if (days.length < MIN_DAYS_PER_TAG) continue;

    const tagMean = mean(days.map((checkIn) => toScaleMean(checkIn.score)));
    const effect = tagMean - baseline;
    if (Math.abs(effect) < MIN_TAG_EFFECT) continue;

    scored.push({
      tagId: tag.id,
      label: tag.label,
      tagMean,
      effect,
      days: days.length,
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
    checkIns.map((checkIn) => [checkIn.localDate, checkIn.score]),
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
      value: score == null ? null : toScaleMean(score),
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
