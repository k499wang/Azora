import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSelfCareGoal } from '../../services/selfCare/selfCareService';
import { sortSelfCareGoals, type SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

export function useCreateSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: (title: string) => {
      if (userId == null) throw new Error('Sign in to save a to-do.');
      return createSelfCareGoal(userId, title);
    },
    onSuccess: (goal) => {
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        sortSelfCareGoals([...current, goal]),
      );
    },
  });
}
