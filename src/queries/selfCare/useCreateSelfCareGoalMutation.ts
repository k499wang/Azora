import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSelfCareGoal } from '../../services/selfCare/selfCareService';
import { sortSelfCareGoals, type SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';
import type { IconName } from '../../components/common/icons/paths';
import { getSelfCareGoalsQueryKey } from './useSelfCareGoalsQuery';

interface CreateInput {
  title: string;
  icon: IconName;
}

export function useCreateSelfCareGoalMutation(userId: string | null, localDate: string) {
  const queryClient = useQueryClient();
  const queryKey = getSelfCareGoalsQueryKey(userId, localDate);

  return useMutation({
    mutationFn: ({ title, icon }: CreateInput) => {
      if (userId == null) throw new Error('Sign in to save a to-do.');
      return createSelfCareGoal(userId, title, icon, localDate);
    },
    onSuccess: (goal) => {
      queryClient.setQueryData<SelfCareGoal[]>(queryKey, (current = []) =>
        sortSelfCareGoals([...current, goal]),
      );
    },
  });
}
