export const MAX_SELF_CARE_GOALS = 20;
export const MAX_SELF_CARE_GOAL_TITLE_LENGTH = 120;

export interface SelfCareGoal {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  completedToday: boolean;
}

export function normalizeSelfCareGoalTitle(title: string): string | null {
  const normalized = title.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_SELF_CARE_GOAL_TITLE_LENGTH
  ) {
    return null;
  }
  return normalized;
}

/**
 * List order is the order the goals were written in and nothing else.
 * Completing one deliberately does not move it: a row that jumps out from under
 * the finger that just tapped it costs the user their place in the list, and
 * the check itself already says the goal is done.
 */
export function sortSelfCareGoals(goals: SelfCareGoal[]): SelfCareGoal[] {
  return [...goals].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

/**
 * Completed goals stay on the journey the way a completed daily does — the rail
 * filling up is the point of it. They only collapse behind a summary row once
 * there are enough of them to bury the goals still open.
 */
export const COMPLETED_COLLAPSE_THRESHOLD = 8;

export interface SelfCareGoalList {
  /** shown on the rail, open goals first */
  rail: SelfCareGoal[];
  /** completed goals folded behind the summary row; empty below the threshold */
  drawer: SelfCareGoal[];
}

export function planSelfCareGoalList(goals: SelfCareGoal[]): SelfCareGoalList {
  const sorted = sortSelfCareGoals(goals);
  const completed = sorted.filter((goal) => goal.completedToday);
  if (completed.length <= COMPLETED_COLLAPSE_THRESHOLD) {
    return { rail: sorted, drawer: [] };
  }
  return {
    rail: sorted.filter((goal) => !goal.completedToday),
    drawer: completed,
  };
}

export function completedGoalsSummary(count: number): string {
  return `${count} ${count === 1 ? 'to-do' : 'to-dos'} done today!`;
}
