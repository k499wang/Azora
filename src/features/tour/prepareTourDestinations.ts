import type { QueryClient } from '@tanstack/react-query';
import { getRecentMoodCheckInsQueryOptions } from '../../queries/mood/useRecentMoodCheckInsQuery';
import { getProgramEnrollmentQueryOptions } from '../../queries/program/useProgramEnrollmentQuery';
import { getSelfCareGoalsQueryOptions } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { getDailyActivityRangeQueryOptions } from '../../queries/tracking/useDailyActivityRangeQuery';
import { AZORA_SCORE_WINDOW_DAYS } from '../plan/domain/azoraScore';

const PLAN_ACTIVITY_DAYS = 56;
const PLAN_MOOD_CHECK_IN_DAYS = 62;

/**
 * Warms the data that the cross-tab tour will immediately reveal. This is
 * deliberately best-effort: network availability must never hold the app's
 * tour or its post-tour presenters in their pending state.
 */
export async function prepareTourDestinations(
  queryClient: QueryClient,
  userId: string | null,
  localDate: string,
): Promise<void> {
  if (userId == null) return;

  try {
    await Promise.allSettled([
      queryClient.fetchQuery(getSelfCareGoalsQueryOptions(userId, localDate)),
      queryClient.fetchQuery(getProgramEnrollmentQueryOptions(userId)),
      queryClient.fetchQuery(
        getDailyActivityRangeQueryOptions(userId, AZORA_SCORE_WINDOW_DAYS),
      ),
      queryClient.fetchQuery(getDailyActivityRangeQueryOptions(userId, PLAN_ACTIVITY_DAYS)),
      queryClient.fetchQuery(
        getRecentMoodCheckInsQueryOptions(userId, PLAN_MOOD_CHECK_IN_DAYS),
      ),
    ]);
  } catch {
    // Query warming is optional. A synchronous cache/client failure must not
    // become an unhandled rejection while the user is entering the app.
  }
}
