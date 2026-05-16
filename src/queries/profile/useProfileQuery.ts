import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProfile } from '../../services/profile/profileService';

export function getProfileQueryKey(userId: string | null) {
  return ['profile', userId] as const;
}

export function useProfileQuery(userId: string | null) {
  return useQuery({
    queryKey: getProfileQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getProfile(userId as string),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });
}
