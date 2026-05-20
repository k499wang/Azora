import { useQuery } from '@tanstack/react-query';
import {
  getSavedOnboardingProfile,
  type SavedOnboardingProfile,
} from '../../services/profile/onboardingStatusService';

export function getSavedOnboardingProfileQueryKey(userId: string | null) {
  return ['saved-onboarding-profile', userId] as const;
}

export function useSavedOnboardingProfileQuery(
  userId: string | null,
  enabled: boolean,
) {
  return useQuery<SavedOnboardingProfile | null>({
    queryKey: getSavedOnboardingProfileQueryKey(userId),
    enabled: enabled && userId != null,
    queryFn: () => getSavedOnboardingProfile(userId as string),
    staleTime: 1000 * 60 * 10,
  });
}
