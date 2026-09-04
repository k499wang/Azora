import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateSelfCareGoal,
  type SelfCareGoalDraft,
} from '../../services/selfCare/selfCareService';
import {
  isSelfCareGoalDueOn,
  sortSelfCareGoals,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

interface UpdateInput extends SelfCareGoalDraft {
  goalId: string;
}

export function useUpdateSelfCareGoalMutation(
  userId: string | null,
  localDate: string,
) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: ({ goalId, ...edit }: UpdateInput) => {
      if (userId == null) throw new Error('Sign in to update a to-do.');
      return updateSelfCareGoal(userId, goalId, edit, localDate);
    },
    // The update returns the whole canonical row, so the cache is seeded with
    // it rather than refetched. Re-sorted on the way in: an edit that puts an
    // hour on a to-do moves it up the day. An edit that puts a repeat on it
    // which today does not answer to — weekdays, chosen on a Saturday — takes
    // the to-do off today's list, the same as a reload would.
    //
    // A to-do turned into a one-off is the one case the response cannot
    // settle: whether it was already finished on an earlier day lives in the
    // completions table, not in the row that comes back, so the day is refetched
    // rather than guessed.
    onSuccess: (goal) => {
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        sortSelfCareGoals(
          current.flatMap((entry) => {
            if (entry.id !== goal.id) return [entry];
            return isSelfCareGoalDueOn(goal, localDate, false) ? [goal] : [];
          }),
        ),
      );
      if (goal.recurrence === 'once') {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
