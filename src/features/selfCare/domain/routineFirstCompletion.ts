export const ROUTINE_STREAK_WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function routineStreakTitle(streakDays: number): string {
  const safeDays = Math.max(1, Math.floor(streakDays));
  return `${safeDays} day streak`;
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

/** Commitment is initial setup, not another step on each new day's reward. */
export function shouldOfferStreakGoal(streakDays: number, streakGoal: number | null): boolean {
  return streakDays === 1 && streakGoal == null;
}
