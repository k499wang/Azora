export interface DailyReminderPreference {
  enabled: boolean;
  time: string;
}

export interface TrialEndingReminderPreference {
  enabled: boolean;
}

export interface NotificationPreferences {
  dailyReminder: DailyReminderPreference;
  trialEndingReminder: TrialEndingReminderPreference;
}

export interface UpdateNotificationPreferencesInput {
  dailyReminder?: Partial<DailyReminderPreference>;
  trialEndingReminder?: Partial<TrialEndingReminderPreference>;
}

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminder: {
    enabled: false,
    time: '08:00',
  },
  trialEndingReminder: {
    enabled: true,
  },
};

export const ONBOARDING_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminder: {
    enabled: true,
    time: '08:00',
  },
  trialEndingReminder: {
    enabled: true,
  },
};
