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

export function sortSelfCareGoals(goals: SelfCareGoal[]): SelfCareGoal[] {
  return [...goals].sort((left, right) => {
    if (left.completedToday !== right.completedToday) {
      return left.completedToday ? 1 : -1;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}
