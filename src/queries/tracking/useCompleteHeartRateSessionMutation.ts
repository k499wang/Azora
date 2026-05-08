import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CaptureResult, PpgFrameSample } from '../../lib/heartRate/types';
import {
  completeHeartRateSession,
} from '../../services/tracking/heartRateService';
import { getDailyFeatureUsageQueryKey } from '../subscriptions/useDailyFeatureUsageQuery';
import { getHomeStatsQueryKey } from './useHomeStatsQuery';

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
      console.log('[hr-gate] completeHeartRateSessionMutation: start', { userId, sampleCount: input.captureSamples.length });
      if (userId == null) {
        throw new Error('Cannot save a heart-rate reading without a signed-in user.');
      }

      const timezone = getDeviceTimezone();

      const sessionId = await completeHeartRateSession({
        captureSamples: input.captureSamples,
        result: input.result,
        timezone,
      });
      console.log('[hr-gate] completeHeartRateSessionMutation: RPC returned', { sessionId });
      return sessionId;
    },
    onSuccess: async (_sessionId, input) => {
      const timezone = getDeviceTimezone();
      // Frame timestamps are a monotonic clock, not wall-clock — use recordedAt for the date key.
      const recordedAtMs = Date.parse(input.result.reading?.recordedAt ?? '');
      const endedAt = Number.isFinite(recordedAtMs) ? recordedAtMs : Date.now();
      const usageDate = formatLocalDate(endedAt, timezone);
      console.log('[hr-gate] mutation onSuccess: invalidating', { userId, usageDate, endedAt });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getHomeStatsQueryKey(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getDailyFeatureUsageQueryKey(userId, usageDate),
        }),
      ]);
      console.log('[hr-gate] mutation onSuccess: invalidate complete');
    },
  });
}
