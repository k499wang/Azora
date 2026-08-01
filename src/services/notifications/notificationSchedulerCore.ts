import type { DailyPlanSchedule } from '../dailyPlan/types';
import {
  AZORA_NOTIFICATION_ID_PREFIX,
  DAILY_REMINDER_DEFINITIONS,
  buildTrialEndingContent,
  type DailyReminderDefinition,
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
  dailyPlanSchedule: DailyPlanSchedule;
  trialEndsAt: string | null;
  now?: Date;
}

const TRIAL_REMINDER_DAYS_BEFORE_END = 1;
const TRIAL_REMINDER_HOUR = 9;
const TRIAL_REMINDER_MINUTE = 0;
const MISSED_TRIAL_REMINDER_DELAY_MS = 5 * 60 * 1000;
const DAILY_REMINDER_HORIZON_DAYS = 14;
export const MAX_PENDING_NOTIFICATION_COUNT = 60;
export const RESERVED_NON_DAILY_NOTIFICATION_COUNT = 4;
export const MAX_PENDING_DAILY_ENTRIES =
  MAX_PENDING_NOTIFICATION_COUNT - RESERVED_NON_DAILY_NOTIFICATION_COUNT;

export function buildDesiredNotificationSchedule(
  {
    preferences,
    dailyPlanSchedule,
    trialEndsAt,
    now = new Date(),
  }: BuildNotificationScheduleInput,
  dailyReminderDefinitions: readonly DailyReminderDefinition[] =
    DAILY_REMINDER_DEFINITIONS,
): DesiredScheduledNotification[] {
  const desired: DesiredScheduledNotification[] = [];
  const dailyEntries: DesiredScheduledNotification[] = [];
  const enabledDefinitions = dailyReminderDefinitions.filter((definition) =>
    preferences.dailyPlanReminders[definition.id].enabled,
  );
  const horizonDays = getDailyReminderHorizonDays(enabledDefinitions.length);

  for (const definition of enabledDefinitions) {
    dailyEntries.push(
      ...buildDailyEntries(
        definition,
        dailyPlanSchedule.actions[definition.scheduleActionId],
        now,
        horizonDays,
      ),
    );
  }

  desired.push(
    ...dailyEntries
      .sort(
        (left, right) =>
          left.trigger.date.getTime() - right.trigger.date.getTime() ||
          left.stableId.localeCompare(right.stableId),
      )
      .slice(0, MAX_PENDING_DAILY_ENTRIES),
  );

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
  definition: DailyReminderDefinition,
  time: string,
  now: Date,
  horizonDays: number,
): DesiredScheduledNotification[] {
  const { hour, minute } = parseTime(time);
  const entries: DesiredScheduledNotification[] = [];

  for (let offset = 0; offset < horizonDays; offset += 1) {
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

    const dateKey = formatDateKey(fireDate);

    entries.push({
      stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:daily:${definition.id}:${dateKey}`,
      kind: definition.kind,
      ...definition.content,
      data: {
        notification_kind: definition.kind,
        reminder_action: definition.id,
      },
      trigger: { type: 'date', date: fireDate },
    });
  }

  return entries;
}

export function getDailyReminderHorizonDays(enabledCount: number): number {
  if (enabledCount <= 0) return 0;

  return Math.max(
    1,
    Math.min(
      DAILY_REMINDER_HORIZON_DAYS,
      Math.floor(MAX_PENDING_DAILY_ENTRIES / enabledCount),
    ),
  );
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

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
