import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setSelfCareGoalCompleted } from '../../services/selfCare/selfCareService';
import { sortSelfCareGoals, type SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

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
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<SelfCareGoal[]>(queryKey);
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        sortSelfCareGoals(
          current.map((goal) =>
            goal.id === goalId ? { ...goal, completedToday: completed } : goal,
          ),
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous != null) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });
}
