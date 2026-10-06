import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useQuery } from '@tanstack/react-query';
import {
  getProfileSummary,
  type ProfileSummary,
} from '../../services/profile/profileSummaryService';
import { mergeProfileSummaryPartialResult } from './profileSummaryStructuralSharing';

export function getProfileSummaryQueryKey(userId: string | null, localDate?: string) {
  return localDate == null
    ? ['profile-summary', userId] as const
    : ['profile-summary', userId, localDate] as const;
}

export function useProfileSummaryQuery(userId: string | null) {
  const localDate = useTodayLocalDate();
  return useQuery<ProfileSummary>({
    queryKey: getProfileSummaryQueryKey(userId, localDate),
    enabled: userId != null,
    queryFn: () => getProfileSummary(userId as string, localDate),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    structuralSharing: (previous, incoming) =>
      mergeProfileSummaryPartialResult(
        previous as ProfileSummary | undefined,
        incoming as ProfileSummary,
      ),
  });
}
