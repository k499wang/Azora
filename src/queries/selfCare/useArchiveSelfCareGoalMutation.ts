import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveSelfCareGoal } from '../../services/selfCare/selfCareService';
import type { SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

export function useArchiveSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: (goalId: string) => {
      if (userId == null) throw new Error('Sign in to remove a to-do.');
      return archiveSelfCareGoal(userId, goalId);
    },
    onSuccess: (_result, goalId) => {
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        current.filter((goal) => goal.id !== goalId),
      );
    },
  });
}
