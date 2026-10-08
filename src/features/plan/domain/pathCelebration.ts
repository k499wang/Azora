/**
 * What the plan path celebrates when it comes back into view.
 *
 * Only progress made since the path was last seen, and only the latest of it:
 * a stamp on the newest finished day and the next day waking up. History is
 * never replayed, and a locked week is never celebrated.
 */

import type { PlanCalendar } from './planCalendar';

export interface PathSeen {
  /** The newest finished day the path has already stamped. */
  stampedDay: number;
  /** The furthest day the path has already woken. */
  wokenDay: number;
}

export interface PathCelebration {
  stampDay: number | null;
  wakeDay: number | null;
  /** False when the waking day starts its week, which has no trail leading in. */
  wakeTrail: boolean;
}

export function isPlanWeekLocked(week: number, isPro: boolean): boolean {
  return !isPro && week >= 2;
}

/** Where the path is now, which is what it has seen once a celebration starts. */
export function pathReached(calendar: PlanCalendar): PathSeen {
  return {
    stampedDay: calendar.daysDone,
    wokenDay: todayDay(calendar) ?? calendar.daysDone,
  };
}

export function pathCelebration(
  seen: PathSeen,
  calendar: PlanCalendar,
  isPro: boolean,
): PathCelebration {
  const latestDone = calendar.daysDone;
  const today = todayDay(calendar);
  const stampDay =
    latestDone > 0 && latestDone > seen.stampedDay && !isDayLocked(calendar, latestDone, isPro)
      ? latestDone
      : null;
  const wakeDay =
    today != null && today > seen.wokenDay && !isDayLocked(calendar, today, isPro)
      ? today
      : null;
  const wakeWeek = wakeDay == null ? undefined : weekOf(calendar, wakeDay);

  return {
    stampDay,
    wakeDay,
    wakeTrail: wakeWeek != null && wakeWeek.days[0]?.day !== wakeDay,
  };
}

function todayDay(calendar: PlanCalendar): number | null {
  for (const week of calendar.weeks) {
    const today = week.days.find((day) => day.state === 'today');
    if (today != null) return today.day;
  }
  return null;
}

function weekOf(calendar: PlanCalendar, day: number) {
  return calendar.weeks.find((week) => week.days.some((entry) => entry.day === day));
}

function isDayLocked(calendar: PlanCalendar, day: number, isPro: boolean): boolean {
  const week = weekOf(calendar, day);
  return week == null || isPlanWeekLocked(week.week, isPro);
}
