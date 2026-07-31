import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DailyPlanExercises } from '../../features/exercise/guidedBreathing/domain/dailyExercisePlan';
import { updateDailyPlanExercises } from '../../services/dailyPlan/dailyPlanExercisesService';
import { getDailyPlanExercisesQueryKey } from './useDailyPlanExercisesQuery';

export function useUpdateDailyPlanExercisesMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: DailyPlanExercises) => {
      if (userId == null) {
        throw new Error(
          'Cannot update daily plan exercises without a signed-in user.',
        );
      }

      return updateDailyPlanExercises(userId, plan);
    },
    onSuccess: async (plan) => {
      const queryKey = getDailyPlanExercisesQueryKey(userId);
      queryClient.setQueryData(queryKey, { status: 'available', plan });
      await queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });
}
