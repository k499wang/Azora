import { useQuery } from '@tanstack/react-query';
import { getActiveSelfCareGoals } from '../../services/selfCare/selfCareService';

/**
 * Shares the `['self-care-goals', userId]` prefix with the per-day lists so the
 * goal mutations' other-dates invalidation refreshes it too: `'all'` sits where
 * a date would, and never equals the date a mutation was made on.
 */
export function getActiveSelfCareGoalsQueryKey(
  userId: string | null,
  localDate: string,
) {
  return ['self-care-goals', userId, 'all', localDate] as const;
}

export function getActiveSelfCareGoalsQueryOptions(userId: string, localDate: string) {
  return {
    queryKey: getActiveSelfCareGoalsQueryKey(userId, localDate),
    queryFn: () => getActiveSelfCareGoals(userId, localDate),
    staleTime: 1000 * 60,
  };
}

export function useActiveSelfCareGoalsQuery(
  userId: string | null,
  localDate: string,
) {
  return useQuery({
    ...getActiveSelfCareGoalsQueryOptions(userId as string, localDate),
    enabled: userId != null,
  });
}
