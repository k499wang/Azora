import { useQuery } from '@tanstack/react-query';
import { getBreathHoldBpmSeriesForSession } from '../../services/tracking/breathHoldService';

export function getBreathHoldBpmSeriesQueryKey(
  userId: string | null,
  sessionId: string | null,
) {
  return ['breath-hold-bpm-series', userId, sessionId] as const;
}

export function useBreathHoldBpmSeriesQuery(
  userId: string | null,
  sessionId: string | null,
) {
  return useQuery({
    queryKey: getBreathHoldBpmSeriesQueryKey(userId, sessionId),
    enabled: userId != null && sessionId != null,
    queryFn: () =>
      getBreathHoldBpmSeriesForSession(
        userId as string,
        sessionId as string,
      ),
    staleTime: 1000 * 60 * 5,
  });
}
