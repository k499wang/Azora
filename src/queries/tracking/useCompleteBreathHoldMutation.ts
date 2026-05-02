import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  completeBreathHold,
  type CompleteBreathHoldInput,
} from '../../services/tracking/breathHoldService';
import { getHomeStatsQueryKey } from './useHomeStatsQuery';

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
      if (userId == null) {
        throw new Error('Cannot save a breath hold without a signed-in user.');
      }

      const timezone = getDeviceTimezone();

      return completeBreathHold({
        ...input,
        timezone,
        localDate: formatLocalDate(input.endedAt, timezone),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getHomeStatsQueryKey(userId),
      });
    },
  });
}
