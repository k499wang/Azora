import { useRef } from 'react';
import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import { setSelfCareGoalCompleted } from '../../services/selfCare/selfCareService';
import {
  selfCareGoalCoins,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';
import { invalidateOtherSelfCareGoalDates } from './createdSelfCareGoalsCache';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';
import { invalidateStreakQueriesWhenSettled } from '../tracking/invalidateStreakQueries';
import { getWalletQueryKey } from '../wallet/useWalletQuery';
import type { WalletEntry } from '../../lib/wallet/coins';

interface ToggleInput {
  goalId: string;
  completed: boolean;
}

export function useToggleSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);
  const walletKey = getWalletQueryKey(userId);
  const mutationKey = ['toggle-self-care-goal', userId, localDate];
  const needsReconciliation = useRef(false);
  const pendingGoalIds = useMutationState({
    filters: { mutationKey, exact: true, status: 'pending' },
    select: (mutation) => (mutation.state.variables as ToggleInput).goalId,
  });

  const mutation = useMutation({
    mutationKey,
    mutationFn: ({ goalId, completed }: ToggleInput) => {
      if (userId == null) throw new Error('Sign in to update a to-do.');
      return setSelfCareGoalCompleted(userId, goalId, localDate, completed);
    },
    onMutate: async ({ goalId, completed }) => {
      await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
      const toggled = queryClient.getQueryData<SelfCareGoal[]>(queryKey)
        ?.find((goal) => goal.id === goalId);
      const previousCompleted = toggled?.completedToday;
      // Completion does not affect the schedule/order. Preserve the cached
      // order and the untouched row objects rather than sorting on every tap.
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        current.map((goal) =>
          goal.id === goalId ? { ...goal, completedToday: completed } : goal,
        ),
      );
      if (toggled != null && previousCompleted === !completed) {
        const coins = selfCareGoalCoins(toggled.recurrence);
        await queryClient.cancelQueries({ queryKey: walletKey, exact: true }, { revert: false });
        // The database triggers write this exact entry alongside the completion,
        // so the pill moves with the tick and no refetch is needed on success.
        queryClient.setQueryData<WalletEntry[]>(walletKey, (current) => current == null
          ? undefined
          : [{
            id: `optimistic-${goalId}-${localDate}-${Date.now()}`,
            currency: 'coin',
            delta: completed ? coins : -coins,
            reason: completed ? 'todo_complete' : 'todo_uncomplete',
            localDate,
            createdAt: new Date().toISOString(),
          }, ...current]);
      }
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
          : current.map((goal) =>
            goal.id === goalId && goal.completedToday === completed
              ? { ...goal, completedToday: previousCompleted }
              : goal,
          ));
      }
      // Refetch only once every concurrent write has reached the server. An
      // earlier snapshot could otherwise overwrite another row's pending tick.
      needsReconciliation.current = true;
    },
    // Streak widgets are secondary to the completed task's acknowledgement.
    // Do not keep the mutation pending while their independent refetches run,
    // and refresh them once a run of quick ticks has settled, not per tick.
    onSuccess: () => {
      if (userId != null) invalidateStreakQueriesWhenSettled(queryClient, userId);
      invalidateOtherSelfCareGoalDates(queryClient, userId, localDate);
    },
    onSettled: () => {
      if (!needsReconciliation.current || queryClient.isMutating({ mutationKey, exact: true }) !== 1) return;
      needsReconciliation.current = false;
      void queryClient.invalidateQueries({ queryKey, exact: true });
      void queryClient.invalidateQueries({ queryKey: walletKey, exact: true });
    },
  });
  return { ...mutation, pendingGoalIds };
}
