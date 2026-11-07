import { useQuery } from '@tanstack/react-query';
import { getTrialRecapCounts } from '../../services/notifications/trialRecapService';

export function getTrialRecapQueryKey(userId: string | null, trialEndsAt: string | null) {
  return ['trial-recap', userId, trialEndsAt] as const;
}

/** Pass a null `trialEndsAt` when no reminder will be sent, so nothing is fetched. */
export function useTrialRecapQuery(userId: string | null, trialEndsAt: string | null) {
  return useQuery({
    queryKey: getTrialRecapQueryKey(userId, trialEndsAt),
    queryFn: () => getTrialRecapCounts(userId as string, trialEndsAt as string),
    enabled: userId != null && trialEndsAt != null,
    staleTime: 1000 * 60,
  });
}
