import type { DailyPlanActionId } from '../dailyPlan/dailyPlanScheduleCore';

export const NOTIFICATION_CHANNELS = {
  dailyReminders: 'daily-reminders',
  billing: 'billing',
} as const;

export const AZORA_NOTIFICATION_ID_PREFIX = 'azora';

export interface NotificationContentDefinition {
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
}

interface DailyReminderDefinitionShape {
  id: DailyPlanActionId;
  kind: string;
  scheduleActionId: DailyPlanActionId;
  content: Omit<NotificationContentDefinition, 'data'>;
  defaultEnabled: boolean;
  onboardingEnabled: boolean;
  settings: {
    title: string;
    subtitle: string;
  };
  onboardingTitle: string;
}

export const DAILY_REMINDER_DEFINITIONS = [
  {
    id: 'session',
    kind: 'daily_plan_session',
    scheduleActionId: 'session',
    content: {
      title: 'Time for your Guided Reset',
      body: 'Your guided reset is ready.',
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    },
    defaultEnabled: false,
    onboardingEnabled: true,
    settings: {
      title: 'Guided Reset',
      subtitle: 'A reminder for your primary guided reset.',
    },
    onboardingTitle: 'Guided Reset',
  },
  {
    id: 'handPicked',
    kind: 'daily_plan_hand_picked',
    scheduleActionId: 'handPicked',
    content: {
      title: 'Your daily reset is ready',
      body: 'Take a few minutes for today\'s reset.',
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    },
    defaultEnabled: false,
    onboardingEnabled: true,
    settings: {
      title: 'Daily reset',
      subtitle: 'A reminder for Azora’s daily reset.',
    },
    onboardingTitle: 'Daily reset',
  },
  {
    id: 'checkIn',
    kind: 'daily_plan_check_in',
    scheduleActionId: 'checkIn',
    content: {
      title: 'Time for The Azora Protocol',
      body: 'Check in with your breath and see how you feel today.',
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    },
    defaultEnabled: false,
    onboardingEnabled: true,
    settings: {
      title: 'The Azora Protocol',
      subtitle: 'A daily reminder to run The Azora Protocol.',
    },
    onboardingTitle: 'The Azora Protocol',
  },
] as const satisfies readonly DailyReminderDefinitionShape[];

export type DailyReminderDefinition =
  (typeof DAILY_REMINDER_DEFINITIONS)[number];
export type DailyPlanReminderId =
  DailyReminderDefinition['id'];
export type DailyScheduledNotificationKind =
  DailyReminderDefinition['kind'];
export type ScheduledNotificationKind =
  | DailyScheduledNotificationKind
  | 'trial_ending';

export function buildDailyPlanReminderContent(
  action: DailyPlanReminderId,
): NotificationContentDefinition {
  const definition = DAILY_REMINDER_DEFINITIONS.find(
    (candidate) => candidate.id === action,
  );

  if (definition == null) {
    throw new Error(`Unknown daily reminder action: ${action}`);
  }

  return {
    ...definition.content,
    data: {
      notification_kind: definition.kind,
      reminder_action: action,
    },
  };
}

export function buildTrialEndingContent(): NotificationContentDefinition {
  return {
    title: 'Your Azora trial ends soon',
    body: 'Review your subscription before it renews.',
    data: {
      notification_kind: 'trial_ending',
      destination: 'Profile',
    },
    channelId: NOTIFICATION_CHANNELS.billing,
  };
}
