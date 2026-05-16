import {
  AZORA_NOTIFICATION_ID_PREFIX,
  buildDailyReminderContent,
  buildTrialEndingContent,
  type ScheduledNotificationKind,
} from './notificationCatalog';
import type { NotificationPreferences } from './types';

export type NotificationScheduleTrigger =
  | {
      type: 'daily';
      hour: number;
      minute: number;
    }
  | {
      type: 'date';
      date: Date;
    };

export interface DesiredScheduledNotification {
  stableId: string;
  kind: ScheduledNotificationKind;
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
  trigger: NotificationScheduleTrigger;
}

export interface BuildNotificationScheduleInput {
  preferences: NotificationPreferences;
  trialEndsAt: string | null;
  now?: Date;
}

const TRIAL_FINAL_DAY_HOUR = 9;
const TRIAL_FINAL_DAY_MINUTE = 0;
const MISSED_TRIAL_REMINDER_DELAY_MS = 5 * 60 * 1000;

export function buildDesiredNotificationSchedule({
  preferences,
  trialEndsAt,
  now = new Date(),
}: BuildNotificationScheduleInput): DesiredScheduledNotification[] {
  const desired: DesiredScheduledNotification[] = [];

  if (preferences.dailyReminders.morning.enabled) {
    const time = parseTime(preferences.dailyReminders.morning.time);
    const content = buildDailyReminderContent('morning');
    desired.push({
      stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:daily:morning`,
      kind: 'daily_reminder_morning',
      ...content,
      trigger: {
        type: 'daily',
        hour: time.hour,
        minute: time.minute,
      },
    });
  }

  if (preferences.dailyReminders.evening.enabled) {
    const time = parseTime(preferences.dailyReminders.evening.time);
    const content = buildDailyReminderContent('evening');
    desired.push({
      stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:daily:evening`,
      kind: 'daily_reminder_evening',
      ...content,
      trigger: {
        type: 'daily',
        hour: time.hour,
        minute: time.minute,
      },
    });
  }

  if (preferences.trialEndingReminder.enabled) {
    const trialReminderDate = getTrialFinalMorningDate(trialEndsAt, now);
    if (trialReminderDate != null) {
      const content = buildTrialEndingContent();
      desired.push({
        stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:trial:ending`,
        kind: 'trial_ending',
        ...content,
        trigger: {
          type: 'date',
          date: trialReminderDate,
        },
      });
    }
  }

  return desired;
}

export function parseTime(value: string): { hour: number; minute: number } {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return { hour: 8, minute: 0 };
  }

  return { hour, minute };
}

export function getTrialFinalMorningDate(
  trialEndsAt: string | null,
  now: Date,
): Date | null {
  if (trialEndsAt == null) return null;

  const trialEnd = new Date(trialEndsAt);
  if (Number.isNaN(trialEnd.getTime()) || trialEnd <= now) {
    return null;
  }

  const reminderDate = new Date(
    trialEnd.getFullYear(),
    trialEnd.getMonth(),
    trialEnd.getDate(),
    TRIAL_FINAL_DAY_HOUR,
    TRIAL_FINAL_DAY_MINUTE,
    0,
    0,
  );

  if (reminderDate > now) {
    return reminderDate;
  }

  const catchUpDate = new Date(now.getTime() + MISSED_TRIAL_REMINDER_DELAY_MS);
  return catchUpDate < trialEnd ? catchUpDate : null;
}
