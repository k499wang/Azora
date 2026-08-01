import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type DailyPlanReminderPreference,
  type DailyPlanReminderPreferences,
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from './types';
import { DAILY_REMINDER_DEFINITIONS } from './notificationCatalog';

interface LegacyDailyReminderPreference {
  enabled?: unknown;
  time?: unknown;
}

export function mergeNotificationPreferences(
  current: NotificationPreferences,
  input: UpdateNotificationPreferencesInput,
): NotificationPreferences {
  return sanitizeNotificationPreferences({
    dailyPlanReminders: Object.fromEntries(
      DAILY_REMINDER_DEFINITIONS.map((definition) => [
        definition.id,
        {
          ...current.dailyPlanReminders[definition.id],
          ...input.dailyPlanReminders?.[definition.id],
        },
      ]),
    ),
    trialEndingReminder: {
      ...current.trialEndingReminder,
      ...input.trialEndingReminder,
    },
  });
}

export function sanitizeNotificationPreferences(
  raw: unknown,
): NotificationPreferences {
  if (!isRecord(raw)) {
    return cloneDefaultNotificationPreferences();
  }

  const reminders = isRecord(raw.dailyPlanReminders)
    ? raw.dailyPlanReminders
    : null;
  const legacyReminder = isRecord(raw.dailyReminder)
    ? (raw.dailyReminder as LegacyDailyReminderPreference)
    : null;
  const trial = isRecord(raw.trialEndingReminder)
    ? raw.trialEndingReminder
    : null;

  return {
    dailyPlanReminders: Object.fromEntries(
      DAILY_REMINDER_DEFINITIONS.map((definition) => {
        const legacyEnabled =
          definition.id === 'session' &&
          reminders == null &&
          typeof legacyReminder?.enabled === 'boolean'
            ? legacyReminder.enabled
            : null;

        return [
          definition.id,
          sanitizeDailyPlanReminder(
            reminders?.[definition.id],
            legacyEnabled ?? definition.defaultEnabled,
          ),
        ];
      }),
    ) as DailyPlanReminderPreferences,
    trialEndingReminder: {
      enabled:
        typeof trial?.enabled === 'boolean'
          ? trial.enabled
          : DEFAULT_NOTIFICATION_PREFERENCES.trialEndingReminder.enabled,
    },
  };
}

function sanitizeDailyPlanReminder(
  raw: unknown,
  fallbackEnabled: boolean,
): DailyPlanReminderPreference {
  const reminder = isRecord(raw) ? raw : null;
  return {
    enabled:
      typeof reminder?.enabled === 'boolean'
        ? reminder.enabled
        : fallbackEnabled,
  };
}

function cloneDefaultNotificationPreferences(): NotificationPreferences {
  return {
    dailyPlanReminders: Object.fromEntries(
      DAILY_REMINDER_DEFINITIONS.map((definition) => [
        definition.id,
        { ...DEFAULT_NOTIFICATION_PREFERENCES.dailyPlanReminders[definition.id] },
      ]),
    ) as DailyPlanReminderPreferences,
    trialEndingReminder: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.trialEndingReminder,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
