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
import { optimisticCoinCredit } from '../wallet/optimisticCoinCredit';
import { EARN_RATES } from '../../lib/wallet/coins';

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
 * Only an unclaimed step is sent here, so the claim is credited its coins up
 * front, as a lesson read is.
 */
export function useClaimPlanTodoStepMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ClaimPlanTodoStepRequest): Promise<ClaimPlanTodoStepResponse> => {
      if (userId == null) {
        throw new Error('Cannot claim a to-do step without a signed-in user.');
      }
      await selfCareTogglesSettled(queryClient, userId);
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

      void queryClient.invalidateQueries({
        queryKey: getProgramDayCompletionsQueryKeyPrefix(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: getProgramEnrollmentQueryKey(userId),
        exact: true,
      });

      return response;
    },
    ...optimisticCoinCredit<ClaimPlanTodoStepRequest>(
      queryClient,
      userId,
      () => EARN_RATES.todoStep,
    ),
  });
}
