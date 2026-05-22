import {
  AZORA_NOTIFICATION_ID_PREFIX,
  buildDailyReminderContent,
  buildTrialEndingContent,
  type ScheduledNotificationKind,
} from './notificationCatalog';
import type { NotificationPreferences } from './types';

export interface NotificationScheduleTrigger {
  type: 'date';
  date: Date;
}

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

const TRIAL_REMINDER_DAYS_BEFORE_END = 1;
const TRIAL_REMINDER_HOUR = 9;
const TRIAL_REMINDER_MINUTE = 0;
const MISSED_TRIAL_REMINDER_DELAY_MS = 5 * 60 * 1000;
const DAILY_REMINDER_HORIZON_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function buildDesiredNotificationSchedule({
  preferences,
  trialEndsAt,
  now = new Date(),
}: BuildNotificationScheduleInput): DesiredScheduledNotification[] {
  const desired: DesiredScheduledNotification[] = [];

  if (preferences.dailyReminder.enabled) {
    desired.push(...buildDailyEntries(preferences.dailyReminder.time, now));
  }

  if (preferences.trialEndingReminder.enabled) {
    const trialReminderDate = getTrialEndingReminderDate(trialEndsAt, now);
    if (trialReminderDate != null) {
      const content = buildTrialEndingContent();
      desired.push({
        stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:trial:ending`,
        kind: 'trial_ending',
        ...content,
        trigger: { type: 'date', date: trialReminderDate },
      });
    }
  }

  return desired;
}

function buildDailyEntries(
  time: string,
  now: Date,
): DesiredScheduledNotification[] {
  const { hour, minute } = parseTime(time);
  const entries: DesiredScheduledNotification[] = [];

  for (let offset = 0; offset < DAILY_REMINDER_HORIZON_DAYS; offset += 1) {
    const fireDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      hour,
      minute,
      0,
      0,
    );

    if (fireDate <= now) continue;

    const dayIndex = getEpochDayIndex(fireDate);
    const content = buildDailyReminderContent(hour, dayIndex);
    const dateKey = formatDateKey(fireDate);

    entries.push({
      stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:daily:${dateKey}`,
      kind: content.data.notification_kind as ScheduledNotificationKind,
      ...content,
      trigger: { type: 'date', date: fireDate },
    });
  }

  return entries;
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

export function getTrialEndingReminderDate(
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
    trialEnd.getDate() - TRIAL_REMINDER_DAYS_BEFORE_END,
    TRIAL_REMINDER_HOUR,
    TRIAL_REMINDER_MINUTE,
    0,
    0,
  );

  if (reminderDate > now) {
    return reminderDate;
  }

  const catchUpDate = new Date(now.getTime() + MISSED_TRIAL_REMINDER_DELAY_MS);
  return catchUpDate < trialEnd ? catchUpDate : null;
}

export function getEpochDayIndex(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
