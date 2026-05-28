import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProfileAvatar } from '../../services/profile/profileAvatarService';
import { getProfileQueryKey } from './useProfileQuery';
import {
  getProfileSummaryQueryKey,
} from './useProfileSummaryQuery';
import type { UserProfile } from '../../services/profile/profileService';
import type { ProfileSummary } from '../../services/profile/profileSummaryService';

export function useUploadProfileAvatarMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (userId == null) {
        throw new Error('Cannot upload a profile photo without a signed-in user.');
      }

      return uploadProfileAvatar(userId, imageUri);
    },
    onSuccess: async (avatarUrl) => {
      queryClient.setQueryData<UserProfile | null>(
        getProfileQueryKey(userId),
        (current) => current == null ? current : { ...current, avatarUrl },
      );

      queryClient.setQueryData<ProfileSummary>(
        getProfileSummaryQueryKey(userId),
        (current) => {
          if (current == null) {
            return current;
          }

          return {
            ...current,
            profile: {
              displayName: current.profile?.displayName ?? null,
              timezone: current.profile?.timezone ?? 'America/Toronto',
              avatarUrl,
            },
          };
        },
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProfileQueryKey(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getProfileSummaryQueryKey(userId),
        }),
      ]);
    },
  });
}
