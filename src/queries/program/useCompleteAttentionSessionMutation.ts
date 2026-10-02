import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AttentionScriptId } from '../../features/attention/domain/attentionScripts';
import {
  advanceProgramDayRemote,
  recordAttentionSessionRemote,
  type AdvanceProgramDayResponse,
} from '../../services/program/programEnrollmentService';
import {
  getProgramDayCompletionsQueryKey,
  getProgramDayCompletionsQueryKeyPrefix,
} from './useProgramDayCompletionsQuery';
import { getProgramEnrollmentQueryKey } from './useProgramEnrollmentQuery';
import { getDailyFeatureUsageQueryKey } from '../subscriptions/useDailyFeatureUsageQuery';
import { getProfileSummaryQueryKey } from '../profile/useProfileSummaryQuery';
import { getHomeStatsQueryKeyPrefix } from '../tracking/useHomeStatsQuery';
import { getDailyActivityRangeQueryKeyPrefix } from '../tracking/useDailyActivityRangeQuery';
import { reconcileCompletionQueries } from '../tracking/completionQueryReconciliation';

export interface CompleteAttentionSessionVariables {
  activityId: string;
  scriptId: AttentionScriptId;
  localDate: string;
  /**
   * The plan day on screen, when this play is that day's own unfinished
   * activity. Null for every other play: from Explore, from search, or a
   * replay of one already done.
   */
  planDay: { enrollmentId: string; programDay: number } | null;
}

const CREDITED_OUTCOMES = new Set<AdvanceProgramDayResponse['outcome']>([
  'recorded',
  'advanced',
  'completed',
]);

/**
 * Counts a finished guided attention Reset.
 *
 * There is no session table behind it. A play the plan credits is recorded by
 * the plan's completion row; any other play — including one the plan refuses
 * because it was already done on another device — is counted on its own.
 * Either way it earns the day's streak and spends a free daily exercise,
 * exactly as a breathing session does. The caches are written inside
 * `mutationFn` because the screen closes on the tap, and React Query drops a
 * mutation's own callbacks once their owner unmounts.
 */
export function useCompleteAttentionSessionMutation(userId: string | null) {
  const queryClient = useQueryClient();

  const creditPlanDay = async (
    activityId: string,
    scriptId: AttentionScriptId,
    localDate: string,
    planDay: { enrollmentId: string; programDay: number },
    owner: string,
  ): Promise<boolean> => {
    const response = await advanceProgramDayRemote({
      localDate,
      modality: 'attention',
      scriptId,
    });

    const credited = CREDITED_OUTCOMES.has(response.outcome);
    if (credited) {
      queryClient.setQueryData<readonly string[]>(
        getProgramDayCompletionsQueryKey(owner, planDay.enrollmentId, planDay.programDay),
        (current) =>
          current == null || !current.includes(activityId)
            ? [...(current ?? []), activityId]
            : current,
      );
    }

    const enrollmentKey = getProgramEnrollmentQueryKey(owner);
    if (response.enrollment != null) {
      await queryClient.cancelQueries({ queryKey: enrollmentKey, exact: true });
      queryClient.setQueryData(enrollmentKey, response.enrollment);
    } else {
      void queryClient.invalidateQueries({ queryKey: enrollmentKey, exact: true });
    }
    void queryClient.invalidateQueries({
      queryKey: getProgramDayCompletionsQueryKeyPrefix(owner),
    });

    return credited;
  };

  return useMutation({
    mutationFn: async ({
      activityId,
      scriptId,
      localDate,
      planDay,
    }: CompleteAttentionSessionVariables): Promise<void> => {
      if (userId == null) {
        throw new Error('Cannot save a Reset without a signed-in user.');
      }

      const credited =
        planDay != null &&
        (await creditPlanDay(activityId, scriptId, localDate, planDay, userId));
      const counted =
        credited || (await recordAttentionSessionRemote({ localDate, scriptId }));
      if (!counted) return;

      await reconcileCompletionQueries(queryClient, [
        { queryKey: getHomeStatsQueryKeyPrefix(userId) },
        { queryKey: getDailyActivityRangeQueryKeyPrefix(userId) },
        { queryKey: getDailyFeatureUsageQueryKey(userId, localDate), exact: true },
        { queryKey: getProfileSummaryQueryKey(userId), exact: true },
      ]);
    },
  });
}
