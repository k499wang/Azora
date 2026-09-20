import type { QueryClient } from '@tanstack/react-query';
import { getProfileSummaryQueryKey } from '../profile/useProfileSummaryQuery';
import { getDailyActivityRangeQueryKeyPrefix } from './useDailyActivityRangeQuery';
import { getHomeStatsQueryKeyPrefix } from './useHomeStatsQuery';

/** Refresh every read that derives the user's streak from daily activity. */
export async function invalidateStreakQueries(
  queryClient: QueryClient,
  userId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getProfileSummaryQueryKey(userId),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: getDailyActivityRangeQueryKeyPrefix(userId),
    }),
    queryClient.invalidateQueries({
      queryKey: getHomeStatsQueryKeyPrefix(userId),
    }),
  ]);
}
