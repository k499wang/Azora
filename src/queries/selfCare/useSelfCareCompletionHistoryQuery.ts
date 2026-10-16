import { useQuery, type QueryClient } from '@tanstack/react-query';
import {
  SELF_CARE_GOAL_HISTORY_DAYS,
  shiftSelfCareLocalDate,
} from '../../features/selfCare/domain/selfCareGoalHistory';
import { fetchSelfCareCompletionHistory } from '../../services/selfCare/selfCareService';

export function getSelfCareCompletionHistoryQueryKey(
  userId: string | null,
  localDate: string,
) {
  return ['self-care-completion-history', userId, localDate] as const;
}

export function invalidateSelfCareCompletionHistory(
  queryClient: QueryClient,
  userId: string | null,
): void {
  void queryClient.invalidateQueries({
    queryKey: ['self-care-completion-history', userId],
  });
}

export function useSelfCareCompletionHistoryQuery(
  userId: string | null,
  localDate: string,
) {
  return useQuery({
    queryKey: getSelfCareCompletionHistoryQueryKey(userId, localDate),
    queryFn: () =>
      fetchSelfCareCompletionHistory(
        userId as string,
        shiftSelfCareLocalDate(localDate, 1 - SELF_CARE_GOAL_HISTORY_DAYS),
        localDate,
      ),
    staleTime: 1000 * 60,
    enabled: userId != null,
  });
}
