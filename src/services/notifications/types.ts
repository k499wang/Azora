export type DailyReminderSlot = 'morning' | 'evening';

export interface DailyReminderPreference {
  enabled: boolean;
  time: string;
}

export interface DailyReminderPreferences {
  morning: DailyReminderPreference;
  evening: DailyReminderPreference;
}

export interface TrialEndingReminderPreference {
  enabled: boolean;
}

export interface NotificationPreferences {
  dailyReminders: DailyReminderPreferences;
  trialEndingReminder: TrialEndingReminderPreference;
}

export interface UpdateNotificationPreferencesInput {
  dailyReminders?: Partial<Record<DailyReminderSlot, Partial<DailyReminderPreference>>>;
  trialEndingReminder?: Partial<TrialEndingReminderPreference>;
}

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminders: {
    morning: {
      enabled: false,
      time: '08:00',
    },
    evening: {
      enabled: false,
      time: '20:30',
    },
  },
  trialEndingReminder: {
    enabled: true,
  },
};

export const ONBOARDING_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminders: {
    morning: {
      enabled: true,
      time: '08:00',
    },
    evening: {
      enabled: true,
      time: '20:30',
    },
  },
  trialEndingReminder: {
    enabled: true,
  },
};
