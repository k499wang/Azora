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

export type PathCelebrationPhase = 'stampRise' | 'stampLand' | 'wakeTrail' | 'wakePop';

/** A celebration as drawn: no phase is its waiting state, before anything plays. */
export interface PathCelebrationShow extends PathCelebration {
  phase: PathCelebrationPhase | null;
}

export const NO_CELEBRATION: PathCelebration = { stampDay: null, wakeDay: null, wakeTrail: false };

export function isPlanWeekLocked(week: number, isPro: boolean): boolean {
  return !isPro && week >= 2;
}

/**
 * Where the path is now, which is what a first view or a still path has seen.
 * A locked day is not woken, so it still wakes once the week unlocks.
 */
export function pathReached(calendar: PlanCalendar, isPro: boolean): PathSeen {
  const today = todayDay(calendar);
  return {
    stampedDay: calendar.daysDone,
    wokenDay: today != null && !isDayLocked(calendar, today, isPro) ? today : calendar.daysDone,
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

export function todayDay(calendar: PlanCalendar): number | null {
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

/**
 * What is still owed. A first view and reduced motion celebrate nothing: the
 * path is drawn as it is, and that is recorded as seen.
 */
export function pendingPathCelebration(
  seen: PathSeen | null,
  calendar: PlanCalendar,
  isPro: boolean,
  reducedMotion: boolean,
): PathCelebration {
  return seen == null || reducedMotion ? NO_CELEBRATION : pathCelebration(seen, calendar, isPro);
}

export function celebrationPhases({ stampDay, wakeDay, wakeTrail }: PathCelebration): PathCelebrationPhase[] {
  const phases: PathCelebrationPhase[] = [];
  if (stampDay != null) phases.push('stampRise', 'stampLand');
  if (wakeDay != null) {
    if (wakeTrail) phases.push('wakeTrail');
    phases.push('wakePop');
  }
  return phases;
}

/** The node the celebration happens at; the stamp and the wake are next to each other. */
export function celebrationTarget({ stampDay, wakeDay }: PathCelebration): number | null {
  return stampDay ?? wakeDay;
}

/** The record once a phase has played: a part is saved the moment it is seen. */
export function seenAfterPhase(
  seen: PathSeen,
  celebration: PathCelebration,
  phase: PathCelebrationPhase,
): PathSeen {
  if (phase === 'stampLand' && celebration.stampDay != null) {
    return { ...seen, stampedDay: celebration.stampDay };
  }
  if (phase === 'wakePop' && celebration.wakeDay != null) {
    return { ...seen, wokenDay: celebration.wakeDay };
  }
  return seen;
}

/**
 * Longest the plan screen is held still for one celebration, from the moment
 * it commits. A celebration that has not finished by then is taken as seen.
 */
export const CELEBRATION_HOLD_MAX_MS = 5000;

/** The record once every part has played, which is where a celebration cut short at the hold limit ends. */
export function seenAfterCelebration(seen: PathSeen, celebration: PathCelebration): PathSeen {
  return celebrationPhases(celebration).reduce(
    (record, phase) => seenAfterPhase(record, celebration, phase),
    seen,
  );
}

export interface PathCelebrationLook {
  /** A finished day still showing its Reset, lit, before its stamp lands. */
  unstampedDay: number | null;
  /** Today drawn as a day to come, with the stretch into it unwalked, before it wakes. */
  sleepingDay: number | null;
  /** The day whose stretch is lighting up. */
  drawingDay: number | null;
}

export function celebrationLook(show: PathCelebrationShow | null): PathCelebrationLook {
  if (show == null) return { unstampedDay: null, sleepingDay: null, drawingDay: null };
  const { phase, stampDay, wakeDay } = show;
  return {
    unstampedDay: phase == null || phase === 'stampRise' ? stampDay : null,
    sleepingDay: phase === 'wakePop' ? null : wakeDay,
    drawingDay: phase === 'wakeTrail' ? wakeDay : null,
  };
}

export interface RevealWindow {
  top: number;
  bottom: number;
}

/**
 * How far to scroll so a node sits in the middle of the uncovered window, or
 * zero when it is already wholly inside it.
 */
export function revealScroll(node: { y: number; height: number }, window: RevealWindow): number {
  return isWithin(node, window) ? 0 : centreScroll(node, window);
}

/** How far to scroll so a node sits in the middle of the uncovered window. */
export function centreScroll(node: { y: number; height: number }, window: RevealWindow): number {
  return node.y + node.height / 2 - (window.top + window.bottom) / 2;
}

export function isWithin(node: { y: number; height: number }, window: RevealWindow): boolean {
  return node.height > 0 && node.y >= window.top && node.y + node.height <= window.bottom;
}
