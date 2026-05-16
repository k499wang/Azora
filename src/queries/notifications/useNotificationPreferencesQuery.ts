import { useQuery } from '@tanstack/react-query';
import {
  getNotificationPreferences,
} from '../../services/notifications/notificationPreferencesService';

export function getNotificationPreferencesQueryKey(userId: string | null) {
  return ['notification-preferences', userId] as const;
}

export function useNotificationPreferencesQuery(userId: string | null) {
  return useQuery({
    queryKey: getNotificationPreferencesQueryKey(userId),
    enabled: userId != null,
    queryFn: () => getNotificationPreferences(userId as string),
    staleTime: 1000 * 60 * 5,
  });
}
