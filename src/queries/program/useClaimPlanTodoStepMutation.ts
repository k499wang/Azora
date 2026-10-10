import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  claimPlanTodoStep,
  type ClaimPlanTodoStepRequest,
  type ClaimPlanTodoStepResponse,
} from '../../services/program/planTodoStepService';
import {
  getProgramDayCompletionsQueryKey,
  getProgramDayCompletionsQueryKeyPrefix,
} from './useProgramDayCompletionsQuery';
import { getProgramEnrollmentQueryKey } from './useProgramEnrollmentQuery';
import { selfCareTogglesSettled } from '../selfCare/useToggleSelfCareGoalMutation';
import { getWalletQueryKey } from '../wallet/useWalletQuery';
import { useAuthStore } from '../../stores/authStore';

export function getClaimPlanTodoStepMutationKey(userId: string | null) {
  return ['claim-plan-todo-step', userId] as const;
}

/**
 * Claims today's "Do a to-do" step, the way `useRecordLessonReadMutation`
 * records a lesson: the claim lands in the day's completions list, unioned into
 * the exact enrollment and day the server chose, with the prefix invalidated
 * behind it. Enrollment refreshes too, without extending the pending claim.
 *
 * The server refuses a claim with no to-do ticked on that date, and the tick
 * that made the step claimable may still be in flight, so pending ticks are
 * awaited first. `not_required` and `no_todo_ticked` come back as outcomes; the
 * refetches behind them put the step and the wallet back where the server has
 * them.
 *
 * Credit only the server's award. A retry can record an existing completion
 * with zero coins, and a refused claim earns nothing.
 */
export function useClaimPlanTodoStepMutation(userId: string | null) {
  const queryClient = useQueryClient();
  const refreshProgram = () => {
    void queryClient.invalidateQueries({
      queryKey: getProgramDayCompletionsQueryKeyPrefix(userId),
    });
    void queryClient.invalidateQueries({
      queryKey: getProgramEnrollmentQueryKey(userId),
      exact: true,
    });
  };

  return useMutation({
    mutationKey: getClaimPlanTodoStepMutationKey(userId),
    mutationFn: async (request: ClaimPlanTodoStepRequest): Promise<ClaimPlanTodoStepResponse> => {
      if (userId == null) {
        throw new Error('Cannot claim a to-do step without a signed-in user.');
      }
      await selfCareTogglesSettled(queryClient, userId);
      if (useAuthStore.getState().user?.id !== userId) {
        throw new Error('Cannot claim a habit after the signed-in account changed.');
      }
      const response = await claimPlanTodoStep(request);

      if (
        response.outcome === 'recorded' &&
        response.activityId != null &&
        response.programDay != null &&
        response.enrollmentId != null
      ) {
        const activityId = response.activityId;
        queryClient.setQueryData<readonly string[]>(
          getProgramDayCompletionsQueryKey(userId, response.enrollmentId, response.programDay),
          (current) =>
            current == null || !current.includes(activityId)
              ? [...(current ?? []), activityId]
              : current,
        );
      }

      refreshProgram();

      return response;
    },
    onSuccess: (response) => {
      if (response.outcome !== 'recorded' || response.coinsAwarded === 0) return;
      const walletKey = getWalletQueryKey(userId);
      void queryClient.cancelQueries({ queryKey: walletKey, exact: true }, { revert: false });
      queryClient.setQueryData<number>(walletKey, (current) =>
        current == null ? undefined : current + response.coinsAwarded);
    },
    // A lost response can follow a committed claim; recover its completion
    // without asking the user to retry a write that already succeeded.
    onError: refreshProgram,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: getWalletQueryKey(userId), exact: true });
    },
  });
}
