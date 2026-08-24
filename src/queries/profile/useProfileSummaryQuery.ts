import { useQuery } from '@tanstack/react-query';
import {
  getProfileSummary,
  type ProfileSummary,
} from '../../services/profile/profileSummaryService';
import { mergeProfileSummaryPartialResult } from './profileSummaryStructuralSharing';

export function getProfileSummaryQueryKey(userId: string | null) {
  return ['profile-summary', userId] as const;
}

export function useProfileSummaryQuery(userId: string | null) {
  return useQuery<ProfileSummary>({
    queryKey: getProfileSummaryQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getProfileSummary(userId as string),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    structuralSharing: (previous, incoming) =>
      mergeProfileSummaryPartialResult(
        previous as ProfileSummary | undefined,
        incoming as ProfileSummary,
      ),
  });
}
