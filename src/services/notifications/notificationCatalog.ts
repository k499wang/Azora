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
      title: 'Time for your reset',
      body: 'The first one of the day is ready.',
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    },
    defaultEnabled: false,
    onboardingEnabled: true,
    settings: {
      title: 'First reset',
      subtitle: 'A reminder for the first reset of the day.',
    },
    onboardingTitle: 'First reset',
  },
  {
    id: 'handPicked',
    kind: 'daily_plan_hand_picked',
    scheduleActionId: 'handPicked',
    content: {
      title: 'Your next reset is ready',
      body: 'Take a few minutes for the middle of the day.',
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    },
    defaultEnabled: false,
    onboardingEnabled: true,
    settings: {
      title: 'Midday reset',
      subtitle: 'A reminder for the second reset, once your plan asks for one.',
    },
    onboardingTitle: 'Midday reset',
  },
  {
    id: 'windDown',
    kind: 'daily_plan_wind_down',
    scheduleActionId: 'windDown',
    content: {
      title: 'Your last reset of the day',
      body: 'The one that closes the day out.',
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    },
    // Off unless the user asks for it. No plan asks for a third exercise before
    // its third week, so by then someone doing it has done it seventeen days
    // running at least and does not need a third prompt — and a third daily
    // notification is how an app gets muted altogether.
    defaultEnabled: false,
    onboardingEnabled: false,
    settings: {
      title: 'Evening reset',
      subtitle: 'A reminder for the last reset of the day, once your plan asks for one.',
    },
    onboardingTitle: 'Evening reset',
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
