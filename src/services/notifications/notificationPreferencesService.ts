import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type DailyReminderPreference,
  type DailyReminderSlot,
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from './types';

interface NotificationPreferencesDatabase {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          user_id: string;
          reminder_enabled: boolean;
          reminder_time: string | null;
          notification_preferences: unknown | null;
        };
        Insert: {
          user_id: string;
          reminder_enabled?: boolean;
          reminder_time?: string | null;
          notification_preferences?: unknown | null;
        };
        Update: {
          user_id?: string;
          reminder_enabled?: boolean;
          reminder_time?: string | null;
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
    .select('user_id, reminder_enabled, reminder_time, notification_preferences')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  return sanitizeNotificationPreferences(
    data.notification_preferences,
    data.reminder_enabled,
    data.reminder_time,
  );
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
    reminder_enabled:
      next.dailyReminders.morning.enabled || next.dailyReminders.evening.enabled,
    reminder_time: next.dailyReminders.morning.enabled
      ? next.dailyReminders.morning.time
      : next.dailyReminders.evening.enabled
        ? next.dailyReminders.evening.time
        : null,
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
    dailyReminders: {
      morning: {
        ...current.dailyReminders.morning,
        ...input.dailyReminders?.morning,
      },
      evening: {
        ...current.dailyReminders.evening,
        ...input.dailyReminders?.evening,
      },
    },
    trialEndingReminder: {
      ...current.trialEndingReminder,
      ...input.trialEndingReminder,
    },
  });
}

export function sanitizeNotificationPreferences(
  raw: unknown,
  legacyReminderEnabled = false,
  legacyReminderTime: string | null = null,
): NotificationPreferences {
  const fallback = getLegacyFallback(legacyReminderEnabled, legacyReminderTime);

  if (raw == null || typeof raw !== 'object') {
    return fallback;
  }

  const record = raw as Partial<NotificationPreferences>;
  const daily = record.dailyReminders;
  const trial = record.trialEndingReminder;

  return {
    dailyReminders: {
      morning: sanitizeDailyReminder(
        daily?.morning,
        fallback.dailyReminders.morning,
      ),
      evening: sanitizeDailyReminder(
        daily?.evening,
        fallback.dailyReminders.evening,
      ),
    },
    trialEndingReminder: {
      enabled:
        typeof trial?.enabled === 'boolean'
          ? trial.enabled
          : fallback.trialEndingReminder.enabled,
    },
  };
}

function getLegacyFallback(
  legacyReminderEnabled: boolean,
  legacyReminderTime: string | null,
): NotificationPreferences {
  const fallback = {
    dailyReminders: {
      morning: { ...DEFAULT_NOTIFICATION_PREFERENCES.dailyReminders.morning },
      evening: { ...DEFAULT_NOTIFICATION_PREFERENCES.dailyReminders.evening },
    },
    trialEndingReminder: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.trialEndingReminder,
    },
  };

  if (legacyReminderEnabled && isValidTime(legacyReminderTime)) {
    fallback.dailyReminders.morning = {
      enabled: true,
      time: normalizeTime(legacyReminderTime),
    };
  }

  return fallback;
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

export function getDailyReminderPreference(
  preferences: NotificationPreferences,
  slot: DailyReminderSlot,
): DailyReminderPreference {
  return preferences.dailyReminders[slot];
}
