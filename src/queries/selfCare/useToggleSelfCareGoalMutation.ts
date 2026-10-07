import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MutationObserver,
  useQueryClient,
  type MutationObserverOptions,
  type QueryClient,
} from '@tanstack/react-query';
import { setSelfCareGoalCompleted } from '../../services/selfCare/selfCareService';
import {
  selfCareGoalCoins,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';
import { invalidateOtherSelfCareGoalDates } from './createdSelfCareGoalsCache';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';
import { invalidateStreakQueriesWhenSettled } from '../tracking/invalidateStreakQueries';
import { whenMotionQuiet } from '../../lib/ui/motionQuiet';
import { getWalletQueryKey } from '../wallet/useWalletQuery';

interface ToggleInput {
  goalId: string;
  completed: boolean;
}

interface ToggleContext {
  previousCompleted: boolean | undefined;
  coinDelta: number | undefined;
}

type ToggleOptions = MutationObserverOptions<
  Awaited<ReturnType<typeof setSelfCareGoalCompleted>>,
  Error,
  ToggleInput,
  ToggleContext
>;

const pendingWalletRefreshes = new WeakMap<QueryClient, Set<string | null>>();

function refreshWalletWhenMotionQuiet(queryClient: QueryClient, userId: string | null) {
  let pending = pendingWalletRefreshes.get(queryClient);
  if (pending == null) {
    pending = new Set();
    pendingWalletRefreshes.set(queryClient, pending);
  }
  if (pending.has(userId)) return;
  pending.add(userId);
  let deferred = false;
  whenMotionQuiet(() => {
    pending.delete(userId);
    if (pending.size === 0) pendingWalletRefreshes.delete(queryClient);
    // A queued refresh may outlive the quiet hold of a newer, slower write.
    // The immediate path still counts its own onSettled call as pending.
    if (deferred && queryClient.isMutating({
      mutationKey: ['toggle-self-care-goal', userId],
    }) > 0) return;
    void queryClient.invalidateQueries({ queryKey: getWalletQueryKey(userId), exact: true });
  });
  deferred = true;
}

export function toggleSelfCareGoalMutationOptions(
  queryClient: QueryClient,
  userId: string | null,
  localDate: string,
): ToggleOptions {
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);
  const walletKey = getWalletQueryKey(userId);
  const mutationKey = ['toggle-self-care-goal', userId, localDate];

  return {
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
      // The pill already shows the optimistic balance, so the correction waits
      // for the tick's motion rather than re-rendering in the middle of it.
      if (queryClient.isMutating({ mutationKey: ['toggle-self-care-goal', userId] }) === 1) {
        refreshWalletWhenMotionQuiet(queryClient, userId);
      }
    },
  };
}

/**
 * Ticks a to-do without subscribing its caller to the write.
 *
 * `useMutation` re-renders its owner on every step of every write — pending,
 * context, success — and the owner here is the whole to-do list. A quick run of
 * ticks queued three list renders per tap behind the celebration each tap had
 * just started, so the run got slower the faster it was tapped. The list only
 * needs to hear about a failure; the optimistic cache write is what draws it.
 */
export function useToggleSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const observer = useMemo(
    () => new MutationObserver(
      queryClient,
      toggleSelfCareGoalMutationOptions(queryClient, userId, localDate),
    ),
    [queryClient, userId, localDate],
  );
  useEffect(() => () => observer.reset(), [observer]);
  const [error, setError] = useState<Error | null>(null);
  // Like `useMutation`, only the latest write's failure is shown; each write
  // still rolls back its own change.
  const latest = useRef(0);

  const toggle = useCallback((input: ToggleInput) => {
    const call = ++latest.current;
    setError(null);
    const write = observer.mutate(input);
    write.catch((failure: Error) => {
      if (latest.current === call) setError(failure);
    });
    return write;
  }, [observer]);

  return { toggle, error };
}
