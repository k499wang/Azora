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
    onMutate: async ({ goalId, featured }) => {
      await queryClient.cancelQueries({ queryKey, exact: true }, { revert: false });
      const previous = queryClient.getQueryData<SelfCareGoal[]>(queryKey);
      const changed = previous?.filter((goal) =>
        goal.featuredToday !== (featured && goal.id === goalId),
      );
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        current.map((goal) => ({
          ...goal,
          featuredToday: featured && goal.id === goalId,
        })),
      );
      return { changed };
    },
    onError: (_error, { goalId, featured }, context) => {
      const changed = context?.changed;
      if (changed != null) {
        queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current) => current?.map((goal) => {
          const previous = changed.find((entry) => entry.id === goal.id);
          return previous != null && goal.featuredToday === (featured && goal.id === goalId)
            ? { ...goal, featuredToday: previous.featuredToday }
            : goal;
        }));
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });
}
