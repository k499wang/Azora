import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSelfCareGoal,
  type SelfCareGoalDraft,
} from '../../services/selfCare/selfCareService';
import {
  isSelfCareGoalDueOn,
  sortSelfCareGoals,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

export function useCreateSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: (draft: SelfCareGoalDraft) => {
      if (userId == null) throw new Error('Sign in to save a to-do.');
      return createSelfCareGoal(userId, draft, localDate);
    },
    // A to-do written for days today is not one of — weekdays, chosen on a
    // Saturday — is saved but does not join today's list, the same as a reload
    // would show it. A brand new to-do has no completions behind it, so today
    // is the only day the answer can depend on and nothing needs refetching.
    onSuccess: (goal) => {
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        isSelfCareGoalDueOn(goal, localDate, false)
          ? sortSelfCareGoals([...current, goal])
          : current,
      );
    },
  });
}
