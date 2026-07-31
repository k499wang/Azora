import { useQuery } from '@tanstack/react-query';
import { getDailyPlanSchedule } from '../../services/dailyPlan/dailyPlanScheduleService';

export function getDailyPlanScheduleQueryKey(userId: string | null) {
  return ['daily-plan-schedule', userId] as const;
}

export function useDailyPlanScheduleQuery(userId: string | null) {
  return useQuery({
    queryKey: getDailyPlanScheduleQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getDailyPlanSchedule(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
