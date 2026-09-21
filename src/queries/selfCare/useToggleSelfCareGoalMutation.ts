import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setSelfCareGoalCompleted } from '../../services/selfCare/selfCareService';
import { sortSelfCareGoals, type SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';
import { invalidateOtherSelfCareGoalDates } from './createdSelfCareGoalsCache';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';
import { invalidateStreakQueries } from '../tracking/invalidateStreakQueries';

interface ToggleInput {
  goalId: string;
  completed: boolean;
}

export function useToggleSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: ({ goalId, completed }: ToggleInput) => {
      if (userId == null) throw new Error('Sign in to update a to-do.');
      return setSelfCareGoalCompleted(userId, goalId, localDate, completed);
    },
    onMutate: async ({ goalId, completed }) => {
      await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
      const previousCompleted = queryClient.getQueryData<SelfCareGoal[]>(queryKey)
        ?.find((goal) => goal.id === goalId)?.completedToday;
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        sortSelfCareGoals(
          current.map((goal) =>
            goal.id === goalId ? { ...goal, completedToday: completed } : goal,
          ),
        ),
      );
      return { previousCompleted };
    },
    // Only on the way back from a failure. A toggle writes one boolean, and the
    // optimistic write above already put the list in the exact shape a refetch
    // would return — so invalidating on success bought nothing and cost a round
    // trip and a whole new list on every tick. Several to-dos ticked quickly
    // queued several of those, each landing as a full re-render of Home in the
    // middle of the celebration it had just set off.
    onError: (_error, { goalId, completed }, context) => {
      const previousCompleted = context?.previousCompleted;
      if (previousCompleted != null) {
        // Restore only this change; routine additions and other edits may have
        // reached the cache while the completion request was pending.
        queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current) => current == null
          ? undefined
          : sortSelfCareGoals(current.map((goal) =>
            goal.id === goalId && goal.completedToday === completed
              ? { ...goal, completedToday: previousCompleted }
              : goal,
          )));
      }
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
    // Streak widgets are secondary to the completed task's acknowledgement.
    // Do not keep the mutation pending while their independent refetches run:
    // callers can show completion feedback as soon as the write is confirmed.
    onSuccess: () => {
      if (userId != null) void invalidateStreakQueries(queryClient, userId);
      invalidateOtherSelfCareGoalDates(queryClient, userId, localDate);
    },
  });
}
