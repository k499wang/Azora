export const ROUTINE_STREAK_WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function routineStreakCount(streakDays: number): number {
  return Math.max(1, Math.floor(streakDays));
}

export function routineStreakSubtitle(streakDays: number): string {
  return routineStreakCount(streakDays) === 1
    ? 'Every streak starts with day one.'
    : 'Come back tomorrow to keep it going.';
}

export interface RoutineStreakWeekSlot {
  label: string;
  name: string;
  filled: boolean;
  isToday: boolean;
}

/** The seven days ending today, oldest first, as Duolingo's streak row shows them. */
export function routineStreakWeekSlots(
  todayIndex: number,
  completedDaysAgo: readonly number[],
): RoutineStreakWeekSlot[] {
  return Array.from({ length: 7 }, (_, slot) => {
    const daysAgo = 6 - slot;
    const name = ROUTINE_STREAK_WEEK_DAYS[(todayIndex - daysAgo + 7) % 7];
    return {
      label: name.slice(0, 2),
      name,
      filled: completedDaysAgo.includes(daysAgo),
      isToday: daysAgo === 0,
    };
  });
}

export interface StreakOdometerColumn {
  from: string;
  to: string;
}

/**
 * Digit columns for rolling `previous` into `next`. A change of length rolls the
 * whole number as one column, since its digits no longer line up.
 */
export function streakOdometerDigits(previous: number, next: number): StreakOdometerColumn[] {
  const from = String(previous);
  const to = String(next);
  if (from.length !== to.length) return [{ from, to }];
  return to.split('').map((digit, index) => ({ from: from[index], to: digit }));
}

export const STREAK_GOAL_DAYS = [7, 14, 30, 50];

export const STREAK_GOAL_LABELS: Readonly<Record<number, string>> = {
  7: 'Strong start',
  14: 'Clearly committed',
  30: 'Unstoppable',
  50: 'Legendary',
};

const ROUTINE_STREAK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The local calendar day a goal of `goalDays` is reached, counting today as streak day `streakDays`. */
export function streakGoalFinishDate(today: Date, streakDays: number, goalDays: number): Date {
  const finish = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  finish.setDate(finish.getDate() + goalDays - routineStreakCount(streakDays));
  return finish;
}

export interface StreakGoalFinish {
  month: string;
  day: string;
  weekday: string;
  label: string;
}

export function formatStreakGoalFinish(date: Date): StreakGoalFinish {
  const month = ROUTINE_STREAK_MONTHS[date.getMonth()];
  const weekday = ROUTINE_STREAK_WEEK_DAYS[date.getDay()];
  const day = String(date.getDate());
  return { month: month.toUpperCase(), day, weekday, label: `${weekday}, ${month} ${day}` };
}

/** Every fresh streak asks for a commitment, so a broken run can be re-promised. */
export function shouldOfferStreakGoal(streakDays: number): boolean {
  return streakDays === 1;
}
