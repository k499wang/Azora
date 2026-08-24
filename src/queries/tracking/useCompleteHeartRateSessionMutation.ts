import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CaptureResult, PpgFrameSample } from '../../lib/heartRate/types';
import { logNetworkFailureDiagnostics } from '../../services/debug/networkFailureDiagnostics';
import {
  logDevDiagnostic,
  warnDevDiagnostic,
} from '../../services/debug/devLogger';
import {
  completeHeartRateSession,
} from '../../services/tracking/heartRateService';
import { getDailyFeatureUsageQueryKey } from '../subscriptions/useDailyFeatureUsageQuery';
import { getHomeStatsQueryKeyPrefix } from './useHomeStatsQuery';
import { getDailyActivityRangeQueryKeyPrefix } from './useDailyActivityRangeQuery';
import { getDayHistoryQueryKeyPrefix } from '../history/useDayHistoryQuery';
import { getHeartRateStatsQueryKey } from './useHeartRateStatsQuery';
import { reconcileCompletionQueries } from './completionQueryReconciliation';

interface CompleteHeartRateSessionMutationInput {
  captureSamples: PpgFrameSample[];
  result: CaptureResult;
}

function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

function formatLocalDate(timestamp: number, timezone: string): string {
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

export function useCompleteHeartRateSessionMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteHeartRateSessionMutationInput) => {
      const startedAt = Date.now();
      logDevDiagnostic('[heart-rate-save] mutation started', {
        sampleCount: input.captureSamples.length,
        hasReading: input.result.reading != null,
      });
      if (userId == null) {
        throw new Error('Cannot save a heart-rate reading without a signed-in user.');
      }

      const timezone = getDeviceTimezone();
      // Frame timestamps are monotonic; the reading timestamp is wall-clock.
      const recordedAtMs = Date.parse(input.result.reading?.recordedAt ?? '');
      const endedAt = Number.isFinite(recordedAtMs) ? recordedAtMs : Date.now();
      const localDate = formatLocalDate(endedAt, timezone);

      try {
        const sessionId = await completeHeartRateSession({
          captureSamples: input.captureSamples,
          result: input.result,
          localDate,
          timezone,
        });
        logDevDiagnostic('[heart-rate-save] mutation succeeded', {
          elapsedMs: Date.now() - startedAt,
        });
        return { sessionId, localDate, timezone, userId };
      } catch (error) {
        warnDevDiagnostic('[heart-rate-save] mutation failed', {
          elapsedMs: Date.now() - startedAt,
          errorMessage: getErrorMessage(error),
        });
        await logNetworkFailureDiagnostics(
          '[heart-rate-save] mutation diagnostics',
          {
            userId,
            elapsedMs: Date.now() - startedAt,
            requestType: 'complete-heart-rate-session-mutation',
            error,
          },
        );
        throw error;
      }
    },
    onSuccess: async (completion) => {
      logDevDiagnostic('[hr-gate] mutation onSuccess: invalidating', {
        usageDate: completion.localDate,
      });

      await reconcileCompletionQueries(queryClient, [
        { queryKey: getHomeStatsQueryKeyPrefix(completion.userId) },
        { queryKey: getDayHistoryQueryKeyPrefix(completion.userId) },
        { queryKey: getDailyActivityRangeQueryKeyPrefix(completion.userId) },
        { queryKey: getHeartRateStatsQueryKey(completion.userId), exact: true },
        {
          queryKey: getDailyFeatureUsageQueryKey(
            completion.userId,
            completion.localDate,
          ),
          exact: true,
        },
      ]);

      logDevDiagnostic('[hr-gate] mutation onSuccess: invalidate complete');
    },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
}
