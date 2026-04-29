import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type CompleteOnboardingInput,
  completeOnboarding,
} from '../../services/profile/onboardingStatusService';
import { getOnboardingStatusQueryKey } from './useOnboardingStatusQuery';

export function useCompleteOnboardingMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: CompleteOnboardingInput) => {
      if (userId == null) {
        throw new Error('Cannot complete onboarding without a signed-in user.');
      }

      await completeOnboarding(userId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getOnboardingStatusQueryKey(userId),
      });
    },
  });
}
