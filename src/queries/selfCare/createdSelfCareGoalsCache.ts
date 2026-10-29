import type { QueryClient } from '@tanstack/react-query';
import {
  isSelfCareGoalDueOn,
  sortSelfCareGoals,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';
import { selfCareGoalExistedOnLocalDate } from '../../services/selfCare/selfCareGoalDate';

/** On a day's list: due that day, and not planned for a later one. */
export function isSelfCareGoalListedOn(goal: SelfCareGoal, localDate: string): boolean {
  return selfCareGoalExistedOnLocalDate({ created_at: goal.createdAt, archived_at: null }, localDate)
    && isSelfCareGoalDueOn(goal, localDate, false);
}

export function invalidateOtherSelfCareGoalDates(
  queryClient: QueryClient,
  userId: string | null,
  localDate: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: ['self-care-goals', userId],
    predicate: (query) => query.queryKey[2] !== localDate,
  });
}

export async function cacheCreatedSelfCareGoals(
  queryClient: QueryClient,
  queryKey: readonly ['self-care-goals', string | null, string],
  goals: SelfCareGoal[],
  goalsForDate?: SelfCareGoal[],
): Promise<void> {
  // A read started before the insert must not replace the newly saved rows.
  // Keep intervening cache writes when cancelling a background refresh.
  await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
  const localDate = queryKey[2];
  queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current) => {
    // Bulk imports include the complete due list from their existing-task
    // read. Merge that snapshot too: a pre-onboarding read can have cached an
    // empty list, which is not a baseline for rows the import has just added.
    // Existing cache rows still win by ID so an edit made while saving remains.
    if (current == null) return goalsForDate;
    const byId = new Map(current.map((goal) => [goal.id, goal]));
    for (const goal of goalsForDate ?? goals) {
      if (!byId.has(goal.id) && isSelfCareGoalListedOn(goal, localDate)) {
        byId.set(goal.id, goal);
      }
    }
    return sortSelfCareGoals([...byId.values()]);
  });
  // Other cached dates can also contain these recurring tasks. The current
  // date only needs fetching if no complete list was available to merge into.
  invalidateOtherSelfCareGoalDates(queryClient, queryKey[1], localDate);
  if (queryClient.getQueryData(queryKey) == null) {
    void queryClient.invalidateQueries({ queryKey, exact: true });
  }
}
