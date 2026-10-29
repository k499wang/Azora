import { useQuery } from '@tanstack/react-query';
import { getPlannedSelfCareGoals } from '../../services/selfCare/selfCareService';

/**
 * Shares the `['self-care-goals', userId]` prefix with the per-day lists, like
 * the active list, so the goal mutations' other-dates invalidation refreshes it.
 */
export function getPlannedSelfCareGoalsQueryKey(userId: string | null, localDate: string) {
  return ['self-care-goals', userId, 'planned', localDate] as const;
}

export function usePlannedSelfCareGoalsQuery(userId: string | null, localDate: string) {
  return useQuery({
    queryKey: getPlannedSelfCareGoalsQueryKey(userId, localDate),
    queryFn: () => getPlannedSelfCareGoals(userId as string, localDate),
    enabled: userId != null,
  });
}
