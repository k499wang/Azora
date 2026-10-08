import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { getMoodCheckInQueryOptions } from '../../queries/mood/useMoodCheckInQuery';
import { getProgramDayCompletionsQueryOptions } from '../../queries/program/useProgramDayCompletionsQuery';
import { getProgramDayFinishDatesQueryOptions } from '../../queries/program/useProgramDayFinishDatesQuery';
import { getProgramEnrollmentQueryOptions } from '../../queries/program/useProgramEnrollmentQuery';
import { useAuthStore } from '../../stores/authStore';
import { programDayForDate } from '../program/domain/programEnrollment';

/**
 * Everything the Plan tab needs for its first frame, through the same query
 * options it reads with, so it opens drawn rather than loading. Entitlement is
 * already read by the app gate. Fire and forget: nothing waits on it.
 */
export async function prefetchPlanPath(
  queryClient: QueryClient,
  userId: string,
  todayLocalDate: string,
): Promise<void> {
  void queryClient.prefetchQuery(getProgramDayFinishDatesQueryOptions(userId));
  void queryClient.prefetchQuery(getMoodCheckInQueryOptions(userId, todayLocalDate));
  const enrollment = await queryClient
    .fetchQuery(getProgramEnrollmentQueryOptions(userId))
    .catch(() => null);
  if (enrollment == null) return;
  void queryClient.prefetchQuery(
    getProgramDayCompletionsQueryOptions(
      userId,
      enrollment.enrollmentId,
      programDayForDate(enrollment, todayLocalDate),
    ),
  );
}

/** Starts the Plan tab's reads as soon as someone is signed in, alongside the app gate. */
export function usePlanPrefetch(): void {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();

  useEffect(() => {
    if (userId != null) void prefetchPlanPath(queryClient, userId, todayLocalDate);
  }, [queryClient, userId, todayLocalDate]);
}
