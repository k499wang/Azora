import { useQuery } from '@tanstack/react-query';
import type { FinishDatesStatus } from '../../features/plan/domain/pathGold';
import { getCurrentProgramDayFinishDates } from '../../services/program/programEnrollmentService';
import { getProgramDayCompletionsQueryKeyPrefix } from './useProgramDayCompletionsQuery';

/**
 * Under the day-completions prefix on purpose: every mutation that credits a
 * plan activity already invalidates that prefix, so this refreshes with it.
 */
export function getProgramDayFinishDatesQueryKey(userId: string | null) {
  return [...getProgramDayCompletionsQueryKeyPrefix(userId), 'finish-dates'] as const;
}

export function getProgramDayFinishDatesQueryOptions(userId: string) {
  return {
    queryKey: getProgramDayFinishDatesQueryKey(userId),
    queryFn: () => getCurrentProgramDayFinishDates(userId),
    staleTime: 1000 * 60 * 5,
  };
}

/**
 * When each finished day of the current plan was finished, for the path's gold
 * coins. Keyed by user, not enrollment, so it loads alongside the enrollment;
 * dates read for a different plan than the one on screen count as none yet.
 */
export function useProgramDayFinishDatesQuery(
  userId: string | null,
  enrollmentId: string | null,
): FinishDatesStatus {
  const query = useQuery({
    ...getProgramDayFinishDatesQueryOptions(userId as string),
    enabled: userId != null,
  });
  const forPlan = query.data != null && query.data.enrollmentId === enrollmentId;
  return {
    isSuccess: query.isSuccess,
    isError: query.isError,
    isFetching: query.isFetching,
    data: forPlan ? query.data?.finishes : undefined,
  };
}
