export const WEEKLY_DAY_GOAL = 5;
export const WEEK_LENGTH_DAYS = 7;

export interface WeeklyProgress {
  daysCompleted: number;
  goal: number;
  goalMet: boolean;
  /** Day offsets 0–6 that qualified, ascending. 0 is today. */
  completedOffsets: number[];
}

export interface SessionStreakView {
  currentStreak: number;
  completedDaysAgo: number[];
  /** True when this session is the one that put today on the board. */
  extendedToday: boolean;
}

/**
 * The completion screen renders before the session write lands, so the cached
 * profile summary still describes yesterday. Fold today in locally — the user
 * just finished a session, which is ground truth regardless of the server
 * round-trip. Without this the reward screen shows an empty dot for the
 * session that was just completed.
 */
export function withTodaysSession(
  currentStreak: number,
  completedDaysAgo: readonly number[],
): SessionStreakView {
  if (completedDaysAgo.includes(0)) {
    return {
      currentStreak,
      completedDaysAgo: [...completedDaysAgo],
      extendedToday: false,
    };
  }

  const continuesRun = completedDaysAgo.includes(1) || currentStreak === 0;

  return {
    currentStreak: continuesRun ? currentStreak + 1 : 1,
    completedDaysAgo: [0, ...completedDaysAgo],
    extendedToday: true,
  };
}

/**
 * Rolling seven-day window rather than a calendar week: the activation target
 * is "five active days in any seven", so a Sunday session should not reset the
 * count the next morning.
 */
export function buildWeeklyProgress(
  completedDaysAgo: readonly number[],
  goal: number = WEEKLY_DAY_GOAL,
): WeeklyProgress {
  const completedOffsets = [...new Set(completedDaysAgo)]
    .filter(
      (daysAgo) =>
        Number.isInteger(daysAgo) && daysAgo >= 0 && daysAgo < WEEK_LENGTH_DAYS,
    )
    .sort((a, b) => a - b);

  return {
    daysCompleted: completedOffsets.length,
    goal,
    goalMet: completedOffsets.length >= goal,
    completedOffsets,
  };
}
