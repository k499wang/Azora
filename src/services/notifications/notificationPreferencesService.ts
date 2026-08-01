import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import {
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from './types';
import {
  mergeNotificationPreferences,
  sanitizeNotificationPreferences,
} from './notificationPreferencesCore';

export {
  mergeNotificationPreferences,
  sanitizeNotificationPreferences,
} from './notificationPreferencesCore';

interface NotificationPreferencesDatabase {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          user_id: string;
          notification_preferences: unknown | null;
        };
        Insert: {
          user_id: string;
          notification_preferences?: unknown | null;
        };
        Update: {
          user_id?: string;
          notification_preferences?: unknown | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type UserPreferencesInsert =
  NotificationPreferencesDatabase['public']['Tables']['user_preferences']['Insert'];

function getNotificationPreferencesClient(): SupabaseClientLike<NotificationPreferencesDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<NotificationPreferencesDatabase>;
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const supabase = getNotificationPreferencesClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('user_id, notification_preferences')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    return sanitizeNotificationPreferences(null);
  }

  return sanitizeNotificationPreferences(data.notification_preferences);
}

export async function updateNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences(userId);
  const next = mergeNotificationPreferences(current, input);
  const supabase = getNotificationPreferencesClient();
  const payload: UserPreferencesInsert = {
    user_id: userId,
    notification_preferences: next,
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' });

  if (error != null) {
    throw error;
  }

  return next;
}
