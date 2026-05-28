import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildNetworkFailureDiagnostics } from '../../services/debug/networkFailureDiagnostics';
import {
  completeBreathHold,
  type CompleteBreathHoldInput,
} from '../../services/tracking/breathHoldService';
import { getProfileSummaryQueryKey } from '../profile/useProfileSummaryQuery';
import { getDailyFeatureUsageQueryKey } from '../subscriptions/useDailyFeatureUsageQuery';
import { getHomeStatsQueryKeyPrefix } from './useHomeStatsQuery';

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

      try {
        return await completeBreathHold({
          ...input,
          timezone,
          localDate: formatLocalDate(input.endedAt, timezone),
        });
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
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      const message = (error as { message?: string } | null)?.message ?? '';
      return /network request failed|fetch failed|aborted|timeout/i.test(message);
    },
    retryDelay: (attempt) => 500 * 2 ** attempt,
    onSuccess: async (_sessionId, input) => {
      const timezone = getDeviceTimezone();
      const localDate = formatLocalDate(input.endedAt, timezone);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getHomeStatsQueryKeyPrefix(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getDailyFeatureUsageQueryKey(userId, localDate),
        }),
        queryClient.invalidateQueries({
          queryKey: getProfileSummaryQueryKey(userId),
        }),
      ]);
    },
  });
}
