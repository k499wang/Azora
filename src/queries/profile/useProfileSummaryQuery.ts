import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProfileSummary } from '../../services/profile/profileSummaryService';

export function getProfileSummaryQueryKey(userId: string | null) {
  return ['profile-summary', userId] as const;
}

export function useProfileSummaryQuery(userId: string | null) {
  return useQuery({
    queryKey: getProfileSummaryQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getProfileSummary(userId as string),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });
}
