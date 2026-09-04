import { useQuery } from '@tanstack/react-query';
import { getSelfCareGoals } from '../../services/selfCare/selfCareService';

export function getSelfCareGoalsQueryKey(
  userId: string | null,
  localDate: string,
) {
  return ['self-care-goals', userId, localDate] as const;
}

export function useSelfCareGoalsQuery(
  userId: string | null,
  localDate: string,
) {
  return useQuery({
    queryKey: getSelfCareGoalsQueryKey(userId, localDate),
    enabled: userId != null,
    queryFn: () => getSelfCareGoals(userId as string, localDate),
    staleTime: 1000 * 60,
  });
}
