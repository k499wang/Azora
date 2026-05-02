import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CaptureResult, PpgFrameSample } from '../../lib/heartRate/types';
import {
  completeHeartRateSession,
} from '../../services/tracking/heartRateService';
import { getHomeStatsQueryKey } from './useHomeStatsQuery';

interface CompleteHeartRateSessionMutationInput {
  captureSamples: PpgFrameSample[];
  result: CaptureResult;
}

function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

export function useCompleteHeartRateSessionMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteHeartRateSessionMutationInput) => {
      if (userId == null) {
        throw new Error('Cannot save a heart-rate reading without a signed-in user.');
      }

      return completeHeartRateSession({
        captureSamples: input.captureSamples,
        result: input.result,
        timezone: getDeviceTimezone(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getHomeStatsQueryKey(userId),
      });
    },
  });
}
