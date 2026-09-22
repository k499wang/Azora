import { useQuery } from '@tanstack/react-query';
import { getSelfCareGoals } from '../../services/selfCare/selfCareService';

export function getSelfCareGoalsQueryKey(
  userId: string | null,
  localDate: string,
) {
  return ['self-care-goals', userId, localDate] as const;
}

export function getSelfCareGoalsQueryOptions(userId: string, localDate: string) {
  return {
    queryKey: getSelfCareGoalsQueryKey(userId, localDate),
    queryFn: () => getSelfCareGoals(userId, localDate),
    staleTime: 1000 * 60,
  };
}

export function useSelfCareGoalsQuery(
  userId: string | null,
  localDate: string,
) {
  return useQuery({
    ...getSelfCareGoalsQueryOptions(userId as string, localDate),
    enabled: userId != null,
  });
}
