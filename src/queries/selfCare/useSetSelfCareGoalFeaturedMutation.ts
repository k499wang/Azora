import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setSelfCareGoalFeatured } from '../../services/selfCare/selfCareService';
import type { SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

interface FeatureInput {
  goalId: string;
  featured: boolean;
}

export function useSetSelfCareGoalFeaturedMutation(
  userId: string | null,
  localDate: string,
) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: ({ goalId, featured }: FeatureInput) => {
      if (userId == null) throw new Error('Sign in to update a to-do.');
      return setSelfCareGoalFeatured(userId, goalId, localDate, featured);
    },
    // Written straight into the cache rather than awaited: the star is the
    // whole feedback for the tap, so it cannot wait on a round trip. Only one
    // to-do may hold the day, so every other row loses it in the same write.
    onMutate: ({ goalId, featured }) => {
      const previous = queryClient.getQueryData<SelfCareGoal[]>(queryKey);
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        current.map((goal) => ({
          ...goal,
          featuredToday: featured && goal.id === goalId,
        })),
      );
      void queryClient.cancelQueries({ queryKey, exact: true });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });
}
