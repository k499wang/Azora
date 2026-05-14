import { useQuery } from '@tanstack/react-query';
import { getUserDefaultTechniqueId } from '../../services/profile/userPreferenceService';

export function getUserDefaultTechniqueQueryKey(userId: string | null) {
  return ['user-default-technique', userId] as const;
}

export function useUserDefaultTechniqueQuery(userId: string | null) {
  return useQuery({
    queryKey: getUserDefaultTechniqueQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getUserDefaultTechniqueId(userId as string),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
