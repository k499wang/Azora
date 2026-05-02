import { useQuery } from '@tanstack/react-query';
import { getHeartRateSessionDetail } from '../../services/tracking/heartRateService';

export function getHeartRateSessionDetailQueryKey(
  userId: string | null,
  sessionId: string | null,
) {
  return ['heart-rate-session-detail', userId, sessionId] as const;
}

export function useHeartRateSessionDetailQuery(
  userId: string | null,
  sessionId: string | null,
) {
  return useQuery({
    queryKey: getHeartRateSessionDetailQueryKey(userId, sessionId),
    enabled: userId != null && sessionId != null,
    queryFn: () => getHeartRateSessionDetail(userId as string, sessionId as string),
    staleTime: 1000 * 60 * 5,
  });
}
