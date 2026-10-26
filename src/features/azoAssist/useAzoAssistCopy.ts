import { useProgramEnrollmentQuery } from '../../queries/program/useProgramEnrollmentQuery';
import { useAuthStore } from '../../stores/authStore';
import { azoAssistCopyFor, type AzoAssistCopy } from './domain/azoAssistCopy';

/** Azo's prompts for the plan the user is running. */
export function useAzoAssistCopy(): AzoAssistCopy {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return azoAssistCopyFor(useProgramEnrollmentQuery(userId).data?.planId);
}
