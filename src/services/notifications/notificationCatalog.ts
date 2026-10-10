import type { OnboardingIntent } from '../../components/onboarding/types';
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
      title: 'Your plan for today is ready',
      body: 'A few small steps. Start with whichever fits.',
      channelId: NOTIFICATION_CHANNELS.dailyReminders,
    },
    defaultEnabled: false,
    onboardingEnabled: true,
    settings: {
      title: 'Plan reminder',
      subtitle: 'A reminder at the time you chose for your first step of the day.',
    },
    onboardingTitle: 'Your plan',
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

type DailyReminderRegistryEntry = (typeof DAILY_REMINDER_DEFINITIONS)[number];

// Content is widened from the registry's literals so a body can be swapped per intent.
export type DailyReminderDefinition = Omit<DailyReminderRegistryEntry, 'content'> & {
  content: DailyReminderDefinitionShape['content'];
};
export type DailyPlanReminderId =
  DailyReminderRegistryEntry['id'];
export type DailyScheduledNotificationKind =
  DailyReminderRegistryEntry['kind'];
export type ScheduledNotificationKind =
  | DailyScheduledNotificationKind
  | 'trial_ending';

const INTENT_REMINDER_BODIES: Partial<
  Record<OnboardingIntent, Record<DailyPlanReminderId, string>>
> = {
  cleaning: {
    session: 'Clear your head first, then one corner of the room.',
    handPicked: 'A few minutes now makes the next task easier to start.',
    windDown: 'Close the day out. The room can wait until tomorrow.',
  },
  stress_relief: {
    session: 'Start the day a notch calmer.',
    handPicked: 'Midday is when stress stacks up. Take a few minutes.',
    windDown: "Put the day's stress down before bed.",
  },
  calm_fast: {
    session: 'Get out of your head before the day gets in it.',
    handPicked: 'A few minutes to quiet the loop.',
    windDown: 'Quiet the replay before you try to sleep.',
  },
  focus: {
    session: 'Clear your head before the first task.',
    handPicked: 'Reset now, then back to work with a clearer head.',
    windDown: 'Close the work day so tomorrow starts clean.',
  },
  emotional_balance: {
    session: 'Start the day with a longer fuse.',
    handPicked: 'A few minutes now, before the afternoon tests your patience.',
    windDown: "Let the day's irritation go before the evening.",
  },
  sleep: {
    session: 'Good nights start in the morning.',
    handPicked: 'A midday pause takes pressure off tonight.',
    windDown: 'Wind down now so sleep comes easier.',
  },
  energy: {
    session: 'A few minutes to wake up properly.',
    handPicked: 'Beat the afternoon slump before it starts.',
    windDown: 'Wind down well tonight, wake up better tomorrow.',
  },
  daily_habit: {
    session: 'Start with the easy thing. It takes a few minutes.',
    handPicked: 'One small win now makes the next one easier.',
    windDown: 'End the day with something done.',
  },
};

export function dailyReminderDefinitionsFor(
  intent: OnboardingIntent,
): readonly DailyReminderDefinition[] {
  const bodies = INTENT_REMINDER_BODIES[intent];
  if (bodies == null) return DAILY_REMINDER_DEFINITIONS;

  return DAILY_REMINDER_DEFINITIONS.map((definition) => ({
    ...definition,
    content: { ...definition.content, body: bodies[definition.id] },
  }));
}

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
      destination: 'Insights',
    },
    channelId: NOTIFICATION_CHANNELS.billing,
  };
}
