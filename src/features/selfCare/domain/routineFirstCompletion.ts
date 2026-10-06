export const ROUTINE_STREAK_WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function routineStreakCount(streakDays: number): number {
  return Math.max(1, Math.floor(streakDays));
}

export function routineStreakSubtitle(streakDays: number): string {
  return routineStreakCount(streakDays) === 1
    ? 'Every streak starts with day one.'
    : 'Come back tomorrow to keep it going.';
}

export function isRoutineStreakWeekdayFilled(
  dayIndex: number,
  todayIndex: number,
  completedDaysAgo: readonly number[],
): boolean {
  const daysAgo = todayIndex - dayIndex;
  return daysAgo >= 0 && completedDaysAgo.includes(daysAgo);
}

export const STREAK_GOAL_DAYS = [7, 14, 30, 50];

/** Every fresh streak asks for a commitment, so a broken run can be re-promised. */
export function shouldOfferStreakGoal(streakDays: number): boolean {
  return streakDays === 1;
}
