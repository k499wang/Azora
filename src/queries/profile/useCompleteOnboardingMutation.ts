import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markOnboardingCompleted } from '../../services/profile/onboardingStatusService';
import { getOnboardingStatusQueryKey } from './useOnboardingStatusQuery';
import { getProfileQueryKey } from './useProfileQuery';
import { getProfileSummaryQueryKey } from './useProfileSummaryQuery';
import { getUserDefaultTechniqueQueryKey } from './useUserDefaultTechniqueQuery';

export function useCompleteOnboardingMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (userId == null) {
        throw new Error('Cannot complete onboarding without a signed-in user.');
      }

      await markOnboardingCompleted(userId);
    },
    onSuccess: async () => {
      queryClient.setQueryData(getOnboardingStatusQueryKey(userId), true);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getOnboardingStatusQueryKey(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getUserDefaultTechniqueQueryKey(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getProfileQueryKey(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getProfileSummaryQueryKey(userId),
        }),
      ]);
    },
  });
}
