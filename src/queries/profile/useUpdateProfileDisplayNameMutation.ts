import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfileDisplayName } from '../../services/profile/profileService';
import { getProfileSummaryQueryKey } from './useProfileSummaryQuery';
import type { ProfileSummary } from '../../services/profile/profileSummaryService';

export function useUpdateProfileDisplayNameMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string | null) => {
      if (userId == null) {
        throw new Error('Cannot update a profile name without a signed-in user.');
      }

      return updateProfileDisplayName(userId, displayName);
    },
    onSuccess: (displayName) => {
      queryClient.setQueryData<ProfileSummary>(
        getProfileSummaryQueryKey(userId),
        (current) => {
          if (current == null) {
            return current;
          }

          return {
            ...current,
            profile: {
              displayName,
              avatarUrl: current.profile?.avatarUrl ?? null,
              timezone: current.profile?.timezone ?? 'America/Toronto',
            },
          };
        },
      );
    },
  });
}
