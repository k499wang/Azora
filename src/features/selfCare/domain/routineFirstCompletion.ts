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

/** The goals still ahead of the streak; a goal already reached is not one to commit to. */
export function streakGoalOptions(streakDays: number): number[] {
  return STREAK_GOAL_DAYS.filter((days) => days > streakDays);
}

/** Offer a goal when none is set, or the one set has been reached. */
export function shouldOfferStreakGoal(committedGoal: number | null, streakDays: number): boolean {
  if (streakGoalOptions(streakDays).length === 0) return false;
  return committedGoal == null || streakDays >= committedGoal;
}
