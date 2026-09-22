import { useQuery } from '@tanstack/react-query';
import { getCurrentProgramEnrollment } from '../../services/program/programEnrollmentService';

export function getProgramEnrollmentQueryKey(userId: string | null) {
  return ['program-enrollment', userId] as const;
}

export function getProgramEnrollmentQueryOptions(userId: string) {
  return {
    queryKey: getProgramEnrollmentQueryKey(userId),
    queryFn: () => getCurrentProgramEnrollment(userId),
    staleTime: 1000 * 60 * 5,
  };
}

/**
 * The active plan, or the latest completed plan, or null when neither exists.
 *
 * Null is an ordinary answer: a user who finished onboarding before plans
 * existed has no enrollment, and neither does one whose backend has not been
 * migrated. Both keep the app they already had.
 */
export function useProgramEnrollmentQuery(userId: string | null) {
  return useQuery({
    ...getProgramEnrollmentQueryOptions(userId as string),
    enabled: userId != null,
  });
}
