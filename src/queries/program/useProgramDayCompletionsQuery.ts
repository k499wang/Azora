import { useQuery } from '@tanstack/react-query';
import { getProgramDayCompletions } from '../../services/program/programEnrollmentService';

export function getProgramDayCompletionsQueryKeyPrefix(userId: string | null) {
  return ['program-day-completions', userId] as const;
}

export function getProgramDayCompletionsQueryKey(
  userId: string | null,
  enrollmentId: string | null,
  programDay: number | null,
) {
  return [
    ...getProgramDayCompletionsQueryKeyPrefix(userId),
    enrollmentId,
    programDay,
  ] as const;
}

/** Which of today's activities are already behind the user. */
export function useProgramDayCompletionsQuery(
  userId: string | null,
  enrollmentId: string | null,
  programDay: number | null,
) {
  return useQuery({
    queryKey: getProgramDayCompletionsQueryKey(userId, enrollmentId, programDay),
    enabled: userId != null && enrollmentId != null && programDay != null,
    queryFn: () =>
      getProgramDayCompletions(
        userId as string,
        enrollmentId as string,
        programDay as number,
      ),
    staleTime: 1000 * 30,
  });
}
