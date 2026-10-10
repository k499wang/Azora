import { useEffect, useRef, useState } from 'react';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import type { RootStackParamList } from '../../app/navigation';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { programDayForDate } from '../program/domain/programEnrollment';
import type { ProgramEnrollmentV3 } from '../program/domain/programEnrollment';
import { getClaimPlanTodoStepMutationKey, useClaimPlanTodoStepMutation } from '../../queries/program/useClaimPlanTodoStepMutation';
import { getProgramEnrollmentQueryKey, useProgramEnrollmentQuery } from '../../queries/program/useProgramEnrollmentQuery';
import type { ClaimPlanTodoStepResponse } from '../../services/program/planTodoStepService';
import { useAuthStore } from '../../stores/authStore';
import { formatLocalDate } from '../../lib/calendar/weekCalendarDays';

type ClaimRequest = Extract<RootStackParamList['ActivityReward'], { claim: unknown }>['claim'];

/** The result screen owns persistence so opening it never waits on the network. */
export function useTodoClaimReward(request: ClaimRequest) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const localDate = useTodayLocalDate();
  const enrollmentQuery = useProgramEnrollmentQuery(userId);
  const queryClient = useQueryClient();
  const { mutateAsync } = useClaimPlanTodoStepMutation(request.userId);
  const claimFilters = { mutationKey: getClaimPlanTodoStepMutationKey(request.userId), exact: true };
  const pendingClaims = useIsMutating(claimFilters);
  const [response, setResponse] = useState<ClaimPlanTodoStepResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(false);
  const started = useRef(false);
  const running = useRef(false);
  const recorded = useRef(false);
  const ownerMatches = userId === request.userId;

  const matchesDay = (enrollment: ProgramEnrollmentV3 | null | undefined, date: string) =>
    date === request.localDate &&
    enrollment?.enrollmentId === request.enrollmentId &&
    programDayForDate(enrollment, date) === request.programDay;

  const contextMatches = ownerMatches && matchesDay(enrollmentQuery.data, localDate);
  const canRetry = contextMatches && pendingClaims === 0 && response == null;
  const retry = async () => {
    if (running.current || recorded.current || !contextMatches || queryClient.isMutating(claimFilters) > 0 ||
      useAuthStore.getState().user?.id !== request.userId) return;
    running.current = true;
    setFailed(false);
    try {
      const next = await mutateAsync({ localDate: request.localDate });
      if (!mounted.current || useAuthStore.getState().user?.id !== request.userId) return;
      if (next.outcome === 'recorded') {
        recorded.current = true;
        setResponse(next);
      } else setFailed(true);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      running.current = false;
    }
  };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (started.current || !canRetry) return;
    started.current = true;
    void retry();
    // One automatic attempt. Further attempts come only from the Retry action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRetry]);

  // Recheck canonical state when Continue is pressed, including a plan switch
  // or midnight after the reward appeared. A stale day never celebrates.
  const getDayCompleteUnitId = () => {
    const enrollment = queryClient.getQueryData<ProgramEnrollmentV3 | null>(
      getProgramEnrollmentQueryKey(request.userId),
    );
    return response?.outcome === 'recorded' &&
      useAuthStore.getState().user?.id === request.userId &&
      matchesDay(enrollment, formatLocalDate(new Date())) &&
      response.enrollmentId === request.enrollmentId &&
      response.programDay === request.programDay
      ? request.dayCompleteUnitId
      : undefined;
  };

  return {
    response: ownerMatches ? response : null,
    failed: failed || !ownerMatches || (!enrollmentQuery.isPending && !contextMatches && response == null),
    canRetry,
    retry,
    getDayCompleteUnitId,
  };
}
