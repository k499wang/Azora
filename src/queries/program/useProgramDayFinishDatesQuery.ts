import { useQuery } from '@tanstack/react-query';
import { getProgramDayFinishDates } from '../../services/program/programEnrollmentService';
import { getProgramDayCompletionsQueryKeyPrefix } from './useProgramDayCompletionsQuery';

/**
 * Under the day-completions prefix on purpose: every mutation that credits a
 * plan activity already invalidates that prefix, so this refreshes with it.
 */
export function getProgramDayFinishDatesQueryKey(
  userId: string | null,
  enrollmentId: string | null,
) {
  return [...getProgramDayCompletionsQueryKeyPrefix(userId), enrollmentId, 'finish-dates'] as const;
}

/** When each finished day of the plan was finished, for the path's gold coins. */
export function useProgramDayFinishDatesQuery(
  userId: string | null,
  enrollmentId: string | null,
) {
  return useQuery({
    queryKey: getProgramDayFinishDatesQueryKey(userId, enrollmentId),
    enabled: userId != null && enrollmentId != null,
    queryFn: () => getProgramDayFinishDates(userId as string, enrollmentId as string),
    staleTime: 1000 * 60 * 5,
  });
}
