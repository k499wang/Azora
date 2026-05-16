import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateNotificationPreferences,
} from '../../services/notifications/notificationPreferencesService';
import type { UpdateNotificationPreferencesInput } from '../../services/notifications/types';
import {
  getNotificationPreferencesQueryKey,
} from './useNotificationPreferencesQuery';

export function useUpdateNotificationPreferencesMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateNotificationPreferencesInput) => {
      if (userId == null) {
        throw new Error('Cannot update notification preferences without a signed-in user.');
      }

      return updateNotificationPreferences(userId, input);
    },
    onSuccess: async (preferences) => {
      queryClient.setQueryData(
        getNotificationPreferencesQueryKey(userId),
        preferences,
      );
      await queryClient.invalidateQueries({
        queryKey: getNotificationPreferencesQueryKey(userId),
      });
    },
  });
}
