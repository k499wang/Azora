import { useQuery } from '@tanstack/react-query';
import { getMoodCheckIn } from '../../services/mood/moodCheckInService';

export function getMoodCheckInQueryKeyPrefix(userId: string | null) {
  return ['mood-check-in', userId] as const;
}

export function getMoodCheckInQueryKey(
  userId: string | null,
  localDate: string | null,
) {
  return [...getMoodCheckInQueryKeyPrefix(userId), localDate] as const;
}

export function getMoodCheckInQueryOptions(userId: string, localDate: string) {
  return {
    queryKey: getMoodCheckInQueryKey(userId, localDate),
    queryFn: () => getMoodCheckIn(userId, localDate),
    staleTime: 1000 * 30,
  };
}

/** Today's check-in. Null is an ordinary answer: it has not been given yet. */
export function useMoodCheckInQuery(
  userId: string | null,
  localDate: string | null,
) {
  return useQuery({
    ...getMoodCheckInQueryOptions(userId as string, localDate as string),
    queryKey: getMoodCheckInQueryKey(userId, localDate),
    enabled: userId != null && localDate != null,
  });
}
