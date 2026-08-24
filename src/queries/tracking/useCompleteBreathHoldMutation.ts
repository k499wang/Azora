import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildNetworkFailureDiagnostics } from '../../services/debug/networkFailureDiagnostics';
import {
  completeBreathHold,
  type CompleteBreathHoldInput,
} from '../../services/tracking/breathHoldService';
import { getProfileSummaryQueryKey } from '../profile/useProfileSummaryQuery';
import { getDailyFeatureUsageQueryKey } from '../subscriptions/useDailyFeatureUsageQuery';
import {
  getHomeStatsQueryKey,
  getHomeStatsQueryKeyPrefix,
} from './useHomeStatsQuery';
import { getDailyActivityRangeQueryKeyPrefix } from './useDailyActivityRangeQuery';
import { getDayHistoryQueryKeyPrefix } from '../history/useDayHistoryQuery';
import { projectBreathHoldHomeStats } from './completionCacheProjections';
import { reconcileCompletionQueries } from './completionQueryReconciliation';
import type { HomeStats } from '../../services/tracking/homeStatsService';

type CompleteBreathHoldMutationInput = Omit<CompleteBreathHoldInput, 'timezone' | 'localDate'>;

function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

function formatLocalDate(timestamp: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (year == null || month == null || day == null) {
    throw new Error(`Unable to format local date for timezone "${timezone}"`);
  }

  return `${year}-${month}-${day}`;
}

export function useCompleteBreathHoldMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteBreathHoldMutationInput) => {
      const startedAt = Date.now();
      if (userId == null) {
        throw new Error('Cannot save a breath hold without a signed-in user.');
      }

      const timezone = getDeviceTimezone();
      const localDate = formatLocalDate(input.endedAt, timezone);

      try {
        const sessionId = await completeBreathHold({
          ...input,
          timezone,
          localDate,
        });
        return { sessionId, localDate, timezone, userId };
      } catch (error) {
        console.warn(
          '[breath-hold-save] mutation diagnostics',
          await buildNetworkFailureDiagnostics({
            userId,
            elapsedMs: Date.now() - startedAt,
            requestType: 'complete-breath-hold-mutation',
            error,
          }),
        );
        throw error;
      }
    },
    onSuccess: async (completion, input) => {
      const homeStatsKey = getHomeStatsQueryKey(
        completion.userId,
        completion.localDate,
      );
      const filters = [
        { queryKey: getHomeStatsQueryKeyPrefix(completion.userId) },
        { queryKey: getDayHistoryQueryKeyPrefix(completion.userId) },
        { queryKey: getDailyActivityRangeQueryKeyPrefix(completion.userId) },
        {
          queryKey: getDailyFeatureUsageQueryKey(
            completion.userId,
            completion.localDate,
          ),
          exact: true,
        },
        { queryKey: getProfileSummaryQueryKey(completion.userId), exact: true },
      ] as const;

      await reconcileCompletionQueries(queryClient, filters, () => {
        queryClient.setQueryData<HomeStats>(homeStatsKey, (current) =>
          projectBreathHoldHomeStats(current, {
            sessionId: completion.sessionId,
            startedAt: input.startedAt,
            endedAt: input.endedAt,
            localDate: completion.localDate,
            timezone: completion.timezone,
            holdSeconds: input.holdSeconds,
            avgBpm: input.avgBpm,
            minBpm: input.minBpm,
            maxBpm: input.maxBpm,
          }),
        );
      });
    },
  });
}
