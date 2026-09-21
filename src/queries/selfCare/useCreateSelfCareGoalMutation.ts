import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSelfCareGoal,
  type SelfCareGoalDraft,
} from '../../services/selfCare/selfCareService';
import { cacheCreatedSelfCareGoals } from './createdSelfCareGoalsCache';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

export function useCreateSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: async (draft: SelfCareGoalDraft) => {
      if (userId == null) throw new Error('Sign in to save a to-do.');
      const goal = await createSelfCareGoal(userId, draft, localDate);
      await cacheCreatedSelfCareGoals(queryClient, queryKey, [goal]);
      return goal;
    },
  });
}
