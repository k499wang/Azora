import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSelfCareGoals,
  type SelfCareGoalDraft,
} from '../../services/selfCare/selfCareService';
import { cacheCreatedSelfCareGoals } from './createdSelfCareGoalsCache';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

/**
 * Routine imports share a per-user queue so repeated screens check existing
 * tasks after the preceding import commits. Returned rows merge by stable ID.
 */
export function useCreateSelfCareGoalsMutation(
  userId: string | null,
  localDate: string,
) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    scope: { id: `self-care-routine-import:${userId}` },
    mutationFn: async (drafts: SelfCareGoalDraft[]) => {
      if (userId == null) throw new Error('Sign in to save a to-do.');
      const result = await createSelfCareGoals(userId, drafts, localDate);
      // Publish before resolving, even if onboarding leaves this screen while
      // the request is in flight. The service already read the complete list.
      await cacheCreatedSelfCareGoals(queryClient, queryKey, result.savedGoals, result.goalsForDate);
      return result.savedGoals;
    },
  });
}
