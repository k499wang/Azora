import { formatLocalDate, parseLocalDate } from '../../../lib/calendar/weekCalendarDays';
import type { SelfCareGoal } from './selfCareGoal';
import { shiftSelfCareLocalDate } from './selfCareGoalHistory';

/** Today and the six days after it: far enough to plan a week's chores, near enough to see coming. */
export const SELF_CARE_GOAL_PLAN_AHEAD_DAYS = 7;

export function selfCareGoalStartDays(todayLocalDate: string): string[] {
  return Array.from(
    { length: SELF_CARE_GOAL_PLAN_AHEAD_DAYS },
    (_, offset) => shiftSelfCareLocalDate(todayLocalDate, offset),
  );
}

export function selfCareGoalStartDayLabel(localDate: string | null, todayLocalDate: string): string {
  if (localDate == null || localDate <= todayLocalDate) return 'Today';
  if (localDate === shiftSelfCareLocalDate(todayLocalDate, 1)) return 'Tomorrow';
  return parseLocalDate(localDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * A planned to-do is written as if it were created at the start of its day.
 * Every build already leaves a to-do off the days before it was created, so an
 * older app keeps it hidden until that day too, with no new column to read.
 */
export function selfCareGoalStartIso(localDate: string): string {
  return parseLocalDate(localDate).toISOString();
}

/** The later day a to-do is planned for, or null once it is on the list. */
export function selfCareGoalStartsOn(
  goal: Pick<SelfCareGoal, 'createdAt'>,
  todayLocalDate: string,
): string | null {
  const created = new Date(goal.createdAt);
  if (Number.isNaN(created.getTime())) return null;
  const startsOn = formatLocalDate(created);
  return startsOn > todayLocalDate ? startsOn : null;
}
