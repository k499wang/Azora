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
    onSuccess: (schedule) => {
      const queryKey = getDailyPlanScheduleQueryKey(userId);
      queryClient.setQueryData(queryKey, schedule);
      // The notification trigger normalizes schedule fields on the server.
      void queryClient.invalidateQueries({ queryKey, exact: true }).catch(() => {});
    },
  });
}
