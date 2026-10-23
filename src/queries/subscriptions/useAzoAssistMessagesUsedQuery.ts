import { useQuery } from '@tanstack/react-query';
import { getAzoAssistMessagesUsed } from '../../services/subscriptions/featureAccess';

export function getAzoAssistMessagesUsedQueryKey(userId: string | null) {
  return ['azo-assist-messages-used', userId] as const;
}

export function useAzoAssistMessagesUsedQuery(userId: string | null) {
  return useQuery({
    queryKey: getAzoAssistMessagesUsedQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getAzoAssistMessagesUsed(userId as string),
    staleTime: 1000 * 60,
  });
}
