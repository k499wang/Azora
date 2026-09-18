import { useQuery } from '@tanstack/react-query';
import { getRecentMoodCheckIns } from '../../services/mood/moodCheckInService';

export function getRecentMoodCheckInsQueryKeyPrefix(userId: string | null) {
  return ['mood-check-ins-recent', userId] as const;
}

export function getRecentMoodCheckInsQueryKey(
  userId: string | null,
  limit: number,
) {
  return [...getRecentMoodCheckInsQueryKeyPrefix(userId), limit] as const;
}

/** A run of recent days, newest first, for anything that reads more than one. */
export function useRecentMoodCheckInsQuery(
  userId: string | null,
  limit: number,
) {
  return useQuery({
    queryKey: getRecentMoodCheckInsQueryKey(userId, limit),
    enabled: userId != null,
    queryFn: () => getRecentMoodCheckIns(userId as string, limit),
    staleTime: 1000 * 60,
  });
}
