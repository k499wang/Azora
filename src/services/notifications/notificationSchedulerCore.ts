import type { DailyPlanSchedule } from '../dailyPlan/types';
import {
  AZORA_NOTIFICATION_ID_PREFIX,
  DAILY_REMINDER_DEFINITIONS,
  NOTIFICATION_CHANNELS,
  PAYWALL_NUDGES,
  buildTrialEndingContent,
  type DailyReminderDefinition,
  type ScheduledNotificationKind,
} from './notificationCatalog';
import type { NotificationPreferences } from './types';
import { TRIAL_REMINDER_DAYS_BEFORE_END, type TrialReminderDaysBeforeEnd } from '../../lib/paywall/trialReminder';

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
  // Only a confirmed non-Pro answer books nudges; unknown means wait.
  isPro?: boolean | null;
  paywallSeenAt?: string | null;
  now?: Date;
}

const TRIAL_REMINDER_HOUR = 9;
const TRIAL_REMINDER_MINUTE = 0;
const MISSED_TRIAL_REMINDER_DELAY_MS = 5 * 60 * 1000;
const DAILY_REMINDER_HORIZON_DAYS = 14;
const NUDGE_EARLIEST_HOUR = 9;
const NUDGE_LATEST_HOUR = 21;

export function buildDesiredNotificationSchedule(
  {
    preferences,
    dailyPlanSchedule,
    trialEndsAt,
    isPro,
    paywallSeenAt = null,
    now = new Date(),
  }: BuildNotificationScheduleInput,
  dailyReminderDefinitions: readonly DailyReminderDefinition[] =
    DAILY_REMINDER_DEFINITIONS,
): DesiredScheduledNotification[] {
  const desired: DesiredScheduledNotification[] = [];
  // Old preference maps and registries can still contain secondary reminders.
  // The plan has one daily prompt, always at its saved main/session time.
  const definition = dailyReminderDefinitions.find(
    (candidate) => candidate.id === 'session' && candidate.scheduleActionId === 'session',
  );
  if (definition != null && preferences.dailyPlanReminders.session?.enabled === true) {
    desired.push(...buildDailyEntries(definition, dailyPlanSchedule.actions.session, now));
  }

  if (preferences.trialEndingReminder.enabled) {
    const trialReminderDate = getTrialEndingReminderDate(
      trialEndsAt,
      now,
      preferences.trialEndingReminder.daysBeforeEnd,
    );
    if (trialReminderDate != null && trialEndsAt != null) {
      const content = buildTrialEndingContent(new Date(trialEndsAt));
      desired.push({
        stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:trial:ending`,
        kind: 'trial_ending',
        ...content,
        trigger: { type: 'date', date: trialReminderDate },
      });
    }
  }

  // A trial on record means they converted once; these are for never-started.
  if (isPro === false && trialEndsAt == null && paywallSeenAt != null) {
    desired.push(...buildPaywallNudges(new Date(paywallSeenAt), now));
  }

  return desired;
}

function buildPaywallNudges(seenAt: Date, now: Date): DesiredScheduledNotification[] {
  if (Number.isNaN(seenAt.getTime())) return [];

  return PAYWALL_NUDGES.flatMap((nudge, index) => {
    const fireDate = withinWakingHours(
      new Date(seenAt.getTime() + nudge.delayHours * 60 * 60 * 1000),
    );
    if (fireDate <= now) return [];

    return [{
      stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:paywall_nudge:${index}`,
      kind: 'paywall_nudge' as const,
      title: nudge.title,
      body: nudge.body,
      data: { notification_kind: 'paywall_nudge', variant_index: String(index) },
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
      trigger: { type: 'date' as const, date: fireDate },
    }];
  });
}

export function withinWakingHours(date: Date): Date {
  const shifted = new Date(date);
  if (shifted.getHours() >= NUDGE_LATEST_HOUR) shifted.setDate(shifted.getDate() + 1);
  if (shifted.getHours() < NUDGE_EARLIEST_HOUR || shifted.getHours() >= NUDGE_LATEST_HOUR) {
    shifted.setHours(NUDGE_EARLIEST_HOUR, 0, 0, 0);
  }
  return shifted;
}

function buildDailyEntries(
  definition: DailyReminderDefinition,
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
  daysBeforeEnd: TrialReminderDaysBeforeEnd = TRIAL_REMINDER_DAYS_BEFORE_END,
): Date | null {
  if (trialEndsAt == null) return null;

  const trialEnd = new Date(trialEndsAt);
  if (Number.isNaN(trialEnd.getTime()) || trialEnd <= now) {
    return null;
  }

  const reminderDate = new Date(
    trialEnd.getFullYear(),
    trialEnd.getMonth(),
    trialEnd.getDate() - daysBeforeEnd,
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
