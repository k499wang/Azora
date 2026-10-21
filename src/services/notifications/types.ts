import { DAILY_REMINDER_DEFINITIONS } from './notificationCatalog';
import type { DailyPlanReminderId } from './notificationCatalog';
import { TRIAL_REMINDER_DAYS_BEFORE_END, type TrialReminderDaysBeforeEnd } from '../../lib/paywall/trialReminder';

export type DailyPlanReminderActionId = DailyPlanReminderId;

export interface DailyPlanReminderPreference {
  enabled: boolean;
}

export type DailyPlanReminderPreferences = Record<
  DailyPlanReminderActionId,
  DailyPlanReminderPreference
>;

export interface TrialEndingReminderPreference {
  enabled: boolean;
  daysBeforeEnd?: TrialReminderDaysBeforeEnd;
}

export interface NotificationPreferences {
  dailyPlanReminders: DailyPlanReminderPreferences;
  trialEndingReminder: TrialEndingReminderPreference;
}

export interface UpdateNotificationPreferencesInput {
  dailyPlanReminders?: Partial<
    Record<DailyPlanReminderActionId, Partial<DailyPlanReminderPreference>>
  >;
  trialEndingReminder?: Partial<TrialEndingReminderPreference>;
}

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyPlanReminders: buildDailyPlanReminderPreferences('default'),
  trialEndingReminder: {
    enabled: false,
    daysBeforeEnd: TRIAL_REMINDER_DAYS_BEFORE_END,
  },
};

export const ONBOARDING_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyPlanReminders: buildDailyPlanReminderPreferences('onboarding'),
  trialEndingReminder: {
    enabled: false,
    daysBeforeEnd: TRIAL_REMINDER_DAYS_BEFORE_END,
  },
};

function buildDailyPlanReminderPreferences(
  mode: 'default' | 'onboarding',
): DailyPlanReminderPreferences {
  return Object.fromEntries(
    DAILY_REMINDER_DEFINITIONS.map((definition) => [
      definition.id,
      {
        enabled:
          mode === 'onboarding'
            ? definition.onboardingEnabled
            : definition.defaultEnabled,
      },
    ]),
  ) as DailyPlanReminderPreferences;
}
