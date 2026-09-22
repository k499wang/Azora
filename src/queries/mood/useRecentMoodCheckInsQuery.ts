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

export function getRecentMoodCheckInsQueryOptions(userId: string, limit: number) {
  return {
    queryKey: getRecentMoodCheckInsQueryKey(userId, limit),
    queryFn: () => getRecentMoodCheckIns(userId, limit),
    staleTime: 1000 * 60,
  };
}

/** A run of recent days, newest first, for anything that reads more than one. */
export function useRecentMoodCheckInsQuery(
  userId: string | null,
  limit: number,
) {
  return useQuery({
    ...getRecentMoodCheckInsQueryOptions(userId as string, limit),
    enabled: userId != null,
  });
}
