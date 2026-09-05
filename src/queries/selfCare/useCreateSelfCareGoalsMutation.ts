import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSelfCareGoals,
  type SelfCareGoalDraft,
} from '../../services/selfCare/selfCareService';
import {
  isSelfCareGoalDueOn,
  sortSelfCareGoals,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

/**
 * A whole list written at once. Onboarding hands over a starter plan; the rows
 * come back canonical, so today's list is seeded rather than refetched.
 */
export function useCreateSelfCareGoalsMutation(
  userId: string | null,
  localDate: string,
) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: (drafts: SelfCareGoalDraft[]) => {
      if (userId == null) throw new Error('Sign in to save a to-do.');
      return createSelfCareGoals(userId, drafts, localDate);
    },
    onSuccess: (goals) => {
      const dueToday = goals.filter((goal) =>
        isSelfCareGoalDueOn(goal, localDate, false),
      );
      if (dueToday.length === 0) return;
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        sortSelfCareGoals([...current, ...dueToday]),
      );
    },
  });
}
