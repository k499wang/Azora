/**
 * Which week card is open.
 *
 * One card at a time, and the week in play is the one that starts that way.
 *
 * The rule lives here rather than in the card because the card is a press and
 * two animated heights, which cannot be tested outside a device. What can be
 * held still is the part that was worth deciding: a press leaves the week it
 * pressed open, or nothing open if that was the one already open.
 */

import type { PlanCalendarWeek } from './planCalendar';

/** The card that starts open, or none on a plan with no week in play. */
export function openWeekOnArrival(
  weeks: readonly PlanCalendarWeek[],
): number | null {
  return weeks.find((week) => week.state === 'today')?.week ?? null;
}

/**
 * The week to open once a card has been pressed.
 *
 * The answer is one week, not a set of open ones, so no press can leave two
 * cards open — pressing a different week moves the open card rather than adding
 * a second.
 */
export function toggledOpenWeek(
  openWeek: number | null,
  pressedWeek: number,
): number | null {
  return openWeek === pressedWeek ? null : pressedWeek;
}
