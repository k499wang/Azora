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
      if (userId == null) {
        throw new Error('Cannot save a heart-rate reading without a signed-in user.');
      }

      const timezone = getDeviceTimezone();

      return completeHeartRateSession({
        captureSamples: input.captureSamples,
        result: input.result,
        timezone,
      });
    },
    onSuccess: async (_sessionId, input) => {
      const timezone = getDeviceTimezone();
      const endedAt = input.captureSamples.reduce<number | null>(
        (latest, sample) => (
          typeof sample.timestamp === 'number' && Number.isFinite(sample.timestamp)
            ? Math.max(latest ?? sample.timestamp, sample.timestamp)
            : latest
        ),
        null,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getHomeStatsQueryKey(userId),
        }),
        ...(endedAt == null
          ? []
          : [
              queryClient.invalidateQueries({
                queryKey: getDailyFeatureUsageQueryKey(
                  userId,
                  formatLocalDate(endedAt, timezone),
                ),
              }),
            ]),
      ]);
    },
  });
}
