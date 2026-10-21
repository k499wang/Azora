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

      const savedPlan = await updateDailyPlanExercises(userId, plan);
      const queryKey = getDailyPlanExercisesQueryKey(userId);
      // A read started before the save must not overwrite the accepted plan.
      await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
      queryClient.setQueryData(queryKey, { status: 'available', plan: savedPlan });
      return savedPlan;
    },
  });
}
