import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type DailyReminderPreference,
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from './types';

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
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
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

export function mergeNotificationPreferences(
  current: NotificationPreferences,
  input: UpdateNotificationPreferencesInput,
): NotificationPreferences {
  return sanitizeNotificationPreferences({
    dailyReminder: {
      ...current.dailyReminder,
      ...input.dailyReminder,
    },
    trialEndingReminder: {
      ...current.trialEndingReminder,
      ...input.trialEndingReminder,
    },
  });
}

export function sanitizeNotificationPreferences(
  raw: unknown,
): NotificationPreferences {
  if (raw == null || typeof raw !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const record = raw as Partial<NotificationPreferences>;
  const reminder = record.dailyReminder;
  const trial = record.trialEndingReminder;

  return {
    dailyReminder: sanitizeDailyReminder(
      reminder,
      DEFAULT_NOTIFICATION_PREFERENCES.dailyReminder,
    ),
    trialEndingReminder: {
      enabled:
        typeof trial?.enabled === 'boolean'
          ? trial.enabled
          : DEFAULT_NOTIFICATION_PREFERENCES.trialEndingReminder.enabled,
    },
  };
}

function sanitizeDailyReminder(
  raw: Partial<DailyReminderPreference> | undefined,
  fallback: DailyReminderPreference,
): DailyReminderPreference {
  return {
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : fallback.enabled,
    time: isValidTime(raw?.time) ? normalizeTime(raw.time) : fallback.time,
  };
}

function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}
