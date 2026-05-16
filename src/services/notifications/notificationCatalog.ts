import type { DailyReminderSlot } from './types';

export const NOTIFICATION_CHANNELS = {
  dailyReminders: 'daily-reminders',
  billing: 'billing',
} as const;

export const AZORA_NOTIFICATION_ID_PREFIX = 'azora';

export type ScheduledNotificationKind =
  | 'daily_reminder_morning'
  | 'daily_reminder_evening'
  | 'trial_ending';

export interface NotificationContentDefinition {
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
}

export function buildDailyReminderContent(
  slot: DailyReminderSlot,
): NotificationContentDefinition {
  if (slot === 'morning') {
    return {
      title: 'Take a breathing reset',
      body: 'A few minutes now can set the tone for your day.',
      data: {
        notification_kind: 'daily_reminder_morning',
        destination: 'DailyExercise',
      },
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    };
  }

  return {
    title: 'Wind down with Azora',
    body: 'Complete a short breathing session before the day ends.',
    data: {
      notification_kind: 'daily_reminder_evening',
      destination: 'DailyExercise',
    },
    channelId: NOTIFICATION_CHANNELS.dailyReminders,
  };
}

export function buildTrialEndingContent(): NotificationContentDefinition {
  return {
    title: 'Your Azora trial ends today',
    body: 'Review your subscription before it renews.',
    data: {
      notification_kind: 'trial_ending',
      destination: 'Profile',
    },
    channelId: NOTIFICATION_CHANNELS.billing,
  };
}
