import { useQuery } from '@tanstack/react-query';
import { getCompletedBreathingTechniqueIdsForDate } from '../../services/tracking/breathingService';

export function getCompletedBreathingTechniqueIdsQueryKey(
  userId: string | null,
  localDate: string | null,
) {
  return ['completed-breathing-technique-ids', userId, localDate] as const;
}

export function useCompletedBreathingTechniqueIdsQuery(
  userId: string | null,
  localDate: string | null,
) {
  return useQuery({
    queryKey: getCompletedBreathingTechniqueIdsQueryKey(userId, localDate),
    enabled: userId != null && localDate != null,
    queryFn: () =>
      getCompletedBreathingTechniqueIdsForDate(
        userId as string,
        localDate as string,
      ),
    staleTime: 1000 * 60 * 5,
  });
}
