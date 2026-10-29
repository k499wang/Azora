import type { OnboardingIntent } from '../../components/onboarding/types';
import type { DailyPlanActionId } from '../dailyPlan/dailyPlanScheduleCore';
import type { ProgramPlanId } from '../../features/program/domain/programCatalogue';
import { formatTrialDate } from '../../lib/paywall/trialReminder';

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

// Secondary entries remain readable for persisted preferences from older builds.
// Only session is shown and scheduled by the current plan reminder policy.
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
      subtitle: 'One daily reminder for your plan at the time you chose.',
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
    onboardingEnabled: false,
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
export type DailyReminderDefinition = Omit<DailyReminderRegistryEntry, 'content' | 'settings' | 'onboardingTitle'> & {
  content: DailyReminderDefinitionShape['content'];
  settings: DailyReminderDefinitionShape['settings'];
  onboardingTitle: string;
};
export type DailyPlanReminderId =
  DailyReminderRegistryEntry['id'];
export type DailyScheduledNotificationKind =
  DailyReminderRegistryEntry['kind'];
export type ScheduledNotificationKind =
  | DailyScheduledNotificationKind
  | 'trial_ending'
  | 'paywall_nudge';

const INTENT_REMINDER_BODIES: Partial<Record<OnboardingIntent, string>> = {
  scrolling: 'Take a pause before the next scroll and choose a small step for yourself.',
  burnout: 'A gentle step is enough today. Leave room for a break.',
  procrastination: 'Choose one task and make the first step small.',
  cleaning: 'Clear your head first, then one corner of the room.',
  stress_relief: 'Start the day a notch calmer.',
  calm_fast: 'Get out of your head before the day gets in it.',
  focus: 'Clear your head before the first task.',
  emotional_balance: 'Start the day with a longer fuse.',
  sleep: 'Take a few minutes to settle down before bed.',
  energy: 'A few minutes to wake up properly.',
  daily_habit: 'Start with the easy thing. It takes a few minutes.',
};

export function dailyReminderDefinitionsFor(
  intent: OnboardingIntent,
  planId?: ProgramPlanId | null,
): readonly DailyReminderDefinition[] {
  // Enrollment owns the routine. A sleep goal can also enroll in another plan.
  if (planId === 'night' || (planId == null && intent === 'sleep')) {
    return [{
      ...DAILY_REMINDER_DEFINITIONS[0],
      content: {
        ...DAILY_REMINDER_DEFINITIONS[0].content,
        title: 'Your bedtime routine is ready',
        body: 'Take a few small steps to settle down before bed.',
      },
      settings: {
        title: 'Bedtime routine',
        subtitle: 'One reminder for your evening routine at the time you chose.',
      },
      onboardingTitle: 'Bedtime routine',
    }];
  }
  const definition = DAILY_REMINDER_DEFINITIONS[0];
  const body = INTENT_REMINDER_BODIES[intent];
  return [{
    ...definition,
    content: { ...definition.content, body: body ?? definition.content.body },
  }];
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

export function buildTrialEndingContent(trialEndsAt: Date): NotificationContentDefinition {
  return {
    title: `Your Azora trial renews ${formatTrialDate(trialEndsAt)}`,
    body: 'Here’s the reminder we promised. Review or cancel anytime before then.',
    data: {
      notification_kind: 'trial_ending',
      destination: 'Insights',
    },
    channelId: NOTIFICATION_CHANNELS.billing,
  };
}

export const PAYWALL_NUDGES = [
  {
    delayHours: 1,
    title: 'Your Personalized Plan is ready',
    body: 'Day 1 takes a few minutes. Start whenever you are ready.',
  },
  {
    delayHours: 24,
    title: 'Day 1 is still waiting',
    body: 'A few small steps, built around what you told us.',
  },
  {
    delayHours: 72,
    title: 'Your plan is still saved',
    body: 'Pick up right where you left off.',
  },
] as const;

/** Session-owned alarms are canceled with their timer, rather than persisted as reminders. */
export function buildTaskTimerContent(input: {
  kind: 'routine' | 'focus';
  title: string;
  nextTitle: string | null;
}): NotificationContentDefinition {
  return {
    title: `Time's up: ${input.title}`,
    body: input.kind === 'focus'
      ? 'Your focus session is complete. Take a moment to reset.'
      : input.nextTitle == null ? 'That was the last one. Tap to finish.' : `Next up: ${input.nextTitle}`,
    data: { notification_kind: input.kind === 'focus' ? 'focus_timer' : 'routine_step' },
    channelId: NOTIFICATION_CHANNELS.dailyReminders,
  };
}
