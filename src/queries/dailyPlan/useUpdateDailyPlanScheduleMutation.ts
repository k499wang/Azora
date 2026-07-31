import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDailyPlanSchedule } from '../../services/dailyPlan/dailyPlanScheduleService';
import type { DailyPlanSchedule } from '../../services/dailyPlan/types';
import { getDailyPlanScheduleQueryKey } from './useDailyPlanScheduleQuery';

export function useUpdateDailyPlanScheduleMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: DailyPlanSchedule) => {
      if (userId == null) {
        throw new Error('Cannot update a daily plan schedule without a signed-in user.');
      }

      return updateDailyPlanSchedule(userId, schedule);
    },
    onSuccess: async (schedule) => {
      const queryKey = getDailyPlanScheduleQueryKey(userId);
      queryClient.setQueryData(queryKey, schedule);
      await queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });
}
