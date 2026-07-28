import { useMutation } from '@tanstack/react-query';
import {
  type OnboardingSurveyAnswers,
  saveOnboardingSurveyAnswers,
} from '../../services/profile/onboardingSurveyService';

// No cache writes or invalidations: nothing in the app reads
// `profiles.acquisition_source`, it exists for analysis only.
export function useSaveOnboardingSurveyMutation(userId: string | null) {
  return useMutation({
    mutationFn: async (answers: OnboardingSurveyAnswers) => {
      if (userId == null) {
        throw new Error('Cannot save onboarding survey answers without a signed-in user.');
      }

      await saveOnboardingSurveyAnswers(userId, answers);
    },
  });
}
