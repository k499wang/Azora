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

/** Today's check-in. Null is an ordinary answer: it has not been given yet. */
export function useMoodCheckInQuery(
  userId: string | null,
  localDate: string | null,
) {
  return useQuery({
    queryKey: getMoodCheckInQueryKey(userId, localDate),
    enabled: userId != null && localDate != null,
    queryFn: () => getMoodCheckIn(userId as string, localDate as string),
    staleTime: 1000 * 30,
  });
}
