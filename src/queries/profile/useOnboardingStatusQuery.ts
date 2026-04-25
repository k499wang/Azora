import { useQuery } from '@tanstack/react-query';
import { getOnboardingStatus } from '../../services/profile/onboardingStatusService';

export function getOnboardingStatusQueryKey(userId: string | null) {
  return ['onboarding-status', userId] as const;
}

export function useOnboardingStatusQuery(userId: string | null) {
  return useQuery({
    queryKey: getOnboardingStatusQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getOnboardingStatus(userId as string),
  });
}
