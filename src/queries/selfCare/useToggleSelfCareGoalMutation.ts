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
import { traceTick } from '../../lib/debug/tickTrace';

interface ToggleInput {
  goalId: string;
  completed: boolean;
}

export function useToggleSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);
  const walletKey = getWalletQueryKey(userId);
  const mutationKey = ['toggle-self-care-goal', userId, localDate];
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
      let coinDelta: number | undefined;
      if (toggled != null && previousCompleted === !completed) {
        const coins = selfCareGoalCoins(toggled.recurrence);
        await queryClient.cancelQueries({ queryKey: walletKey, exact: true }, { revert: false });
        // Move a loaded balance with the tick. The completion response does
        // not include the balance, so reconcile it once pending writes settle.
        coinDelta = completed ? coins : -coins;
        const delta = coinDelta;
        queryClient.setQueryData<number>(walletKey, (current) =>
          current == null ? undefined : current + delta);
      }
      traceTick('optimistic update applied', {
        completedInCache: queryClient.getQueryData<SelfCareGoal[]>(queryKey)
          ?.find((goal) => goal.id === goalId)?.completedToday,
        coinDelta,
        walletNow: queryClient.getQueryData<number>(walletKey),
      });
      return { previousCompleted, coinDelta };
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
      const coinDelta = context?.coinDelta;
      if (coinDelta != null) {
        queryClient.setQueryData<number>(walletKey, (current) =>
          current == null ? undefined : current - coinDelta);
      }
      // Mark this shared cache dirty without fetching over another pending
      // tick. The last caller can reconcile it even if this hook unmounts.
      void queryClient.invalidateQueries({ queryKey, exact: true, refetchType: 'none' });
    },
    // Streak widgets are secondary to the completed task's acknowledgement.
    // Do not keep the mutation pending while their independent refetches run,
    // and refresh them once a run of quick ticks has settled, not per tick.
    onSuccess: () => {
      if (userId != null) invalidateStreakQueriesWhenSettled(queryClient, userId);
      invalidateOtherSelfCareGoalDates(queryClient, userId, localDate);
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey, exact: true }) === 1 &&
          queryClient.getQueryState(queryKey)?.isInvalidated) {
        void queryClient.invalidateQueries({ queryKey, exact: true });
      }
      // The balance is server-owned. A cold cache, an idempotent write, or
      // another balance refresh may have bypassed the optimistic delta.
      // Wait across dates too: the wallet belongs to the user, not one list.
      if (queryClient.isMutating({ mutationKey: ['toggle-self-care-goal', userId] }) === 1) {
        traceTick('balance refetch requested');
        void queryClient.invalidateQueries({ queryKey: walletKey, exact: true });
      }
    },
  });
  return { ...mutation, pendingGoalIds };
}
