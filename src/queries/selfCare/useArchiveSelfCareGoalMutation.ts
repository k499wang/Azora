import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveSelfCareGoal } from '../../services/selfCare/selfCareService';
import type { SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';
import { invalidateOtherSelfCareGoalDates } from './createdSelfCareGoalsCache';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

export function useArchiveSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: (goalId: string) => {
      if (userId == null) throw new Error('Sign in to remove a to-do.');
      return archiveSelfCareGoal(userId, goalId);
    },
    onSuccess: async (_result, goalId) => {
      await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
      const hasCurrentList = queryClient.getQueryData<SelfCareGoal[]>(queryKey) != null;
      if (hasCurrentList) {
        queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
          current.filter((goal) => goal.id !== goalId),
        );
      } else {
        void queryClient.invalidateQueries({ queryKey, exact: true });
      }
      invalidateOtherSelfCareGoalDates(queryClient, userId, localDate);
    },
  });
}
