/**
 * Last week, against the week before it.
 *
 * The only unit on this screen that can actually be judged. The Azora Score is
 * this week in progress — it moves under the user all week and is never
 * finished — so a closed week is the smallest stretch anything honest can be
 * said about.
 *
 * Every figure is reported with its direction. "5 days" means nothing on its
 * own; "5, up from 3" is the whole point, and a week that went backwards says
 * so in the same words. Nothing here is softened: a card that only ever
 * reports improvement stops being read inside a month.
 */

import {
  MOOD_SCALE_MAX,
  MOOD_SCALE_MIN,
} from '../../mood/domain/moodCheckIn';
import {
  formatLocalDate,
  parseLocalDate,
} from '../../../lib/calendar/weekCalendarDays';

export const DAYS_IN_WEEK = 7;
/**
 * Below this, an average is one or two days wearing a decimal point.
 *
 * A week with two check-ins in it has not been measured, and printing its mean
 * beside a full week's would invite a comparison neither number supports.
 */
export const MIN_CHECK_INS_FOR_AVERAGE = 3;

export interface WeeklyReviewActivityDay {
  activityDate: string;
  qualifiesForStreak: boolean;
}

export interface WeeklyReviewCheckIn {
  localDate: string;
  /** The stored 0–100 reading. */
  score: number;
}

export interface WeeklyReview {
  /** `YYYY-MM-DD` bounds of the week being reported, inclusive. */
  start: string;
  end: string;
  daysKept: number;
  /** Null when there is no earlier week to compare against. */
  daysKeptBefore: number | null;
  /** The week's mean on the check-in's own 1–5 scale, or null when too thin. */
  mood: number | null;
  moodBefore: number | null;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

/** The Sunday of the week `date` falls in. */
function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

function inRange(localDate: string, start: string, end: string): boolean {
  return localDate >= start && localDate <= end;
}

function meanScore(scores: number[]): number | null {
  if (scores.length < MIN_CHECK_INS_FOR_AVERAGE) return null;

  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  // Back onto the five points the questions were answered on, so the number
  // matches the faces rather than the storage format.
  return (
    MOOD_SCALE_MIN + (mean / 100) * (MOOD_SCALE_MAX - MOOD_SCALE_MIN)
  );
}

/**
 * Builds the report for the last *completed* week.
 *
 * `daysKeptBefore` is null when the user was not here the week before that:
 * zero days kept and "not yet using the app" are the same number and very
 * different facts, and reporting the first as a decline would be the card
 * lying on somebody's second week.
 */
export function weeklyReview(
  activity: WeeklyReviewActivityDay[],
  checkIns: WeeklyReviewCheckIn[],
  todayLocalDate: string,
): WeeklyReview {
  const thisWeekStart = startOfWeek(parseLocalDate(todayLocalDate));
  const start = formatLocalDate(addDays(thisWeekStart, -DAYS_IN_WEEK));
  const end = formatLocalDate(addDays(thisWeekStart, -1));
  const beforeStart = formatLocalDate(addDays(thisWeekStart, -DAYS_IN_WEEK * 2));
  const beforeEnd = formatLocalDate(addDays(thisWeekStart, -DAYS_IN_WEEK - 1));

  const kept = activity.filter((day) => day.qualifiesForStreak);
  const daysKept = kept.filter((day) =>
    inRange(day.activityDate, start, end),
  ).length;
  const daysKeptBeforeCount = kept.filter((day) =>
    inRange(day.activityDate, beforeStart, beforeEnd),
  ).length;

  // Anything at all on or before that week means they were here for it, so a
  // zero is a real zero rather than an absence of the user.
  const wasHereBefore =
    daysKeptBeforeCount > 0 ||
    activity.some((day) => day.activityDate <= beforeEnd) ||
    checkIns.some((checkIn) => checkIn.localDate <= beforeEnd);

  const scoresIn = (from: string, to: string) =>
    checkIns
      .filter((checkIn) => inRange(checkIn.localDate, from, to))
      .map((checkIn) => checkIn.score);

  return {
    start,
    end,
    daysKept,
    daysKeptBefore: wasHereBefore ? daysKeptBeforeCount : null,
    mood: meanScore(scoresIn(start, end)),
    moodBefore: meanScore(scoresIn(beforeStart, beforeEnd)),
  };
}

export type WeeklyReviewDirection = 'up' | 'down' | 'same';

export function compareToBefore(
  value: number,
  before: number | null,
  /** Differences below this read as noise rather than movement. */
  deadband = 0,
): WeeklyReviewDirection | null {
  if (before == null) return null;
  if (Math.abs(value - before) <= deadband) return 'same';
  return value > before ? 'up' : 'down';
}
