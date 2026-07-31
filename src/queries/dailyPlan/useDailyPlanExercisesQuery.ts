import { useQuery } from '@tanstack/react-query';
import { getDailyPlanExercises } from '../../services/dailyPlan/dailyPlanExercisesService';

export function getDailyPlanExercisesQueryKey(userId: string | null) {
  return ['daily-plan-exercises', userId] as const;
}

export function useDailyPlanExercisesQuery(userId: string | null) {
  return useQuery({
    queryKey: getDailyPlanExercisesQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getDailyPlanExercises(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
