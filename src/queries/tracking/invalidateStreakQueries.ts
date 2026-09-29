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

/** long enough to span a run of quick ticks, short enough to feel current */
const STREAK_REFRESH_SETTLE_MS = 1000;
const pendingStreakRefresh = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * The same refresh, once a run of quick writes has stopped.
 *
 * Ticking five to-dos in a row asked for fifteen refetches, each landing as a
 * re-render of every screen that shows the streak while the next tick's
 * celebration was playing. The streak only needs the last of them.
 */
export function invalidateStreakQueriesWhenSettled(
  queryClient: QueryClient,
  userId: string,
): void {
  const pending = pendingStreakRefresh.get(userId);
  if (pending != null) clearTimeout(pending);
  pendingStreakRefresh.set(
    userId,
    setTimeout(() => {
      pendingStreakRefresh.delete(userId);
      void invalidateStreakQueries(queryClient, userId);
    }, STREAK_REFRESH_SETTLE_MS),
  );
}
