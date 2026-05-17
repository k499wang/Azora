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

interface DailyReminderVariant {
  title: string;
  body: string;
}

const MORNING_VARIANTS: DailyReminderVariant[] = [
  { title: 'Take a breathing reset', body: 'A few minutes now can set the tone for your day.' },
  { title: 'Start with one good breath', body: 'Just sixty seconds to find your floor.' },
  { title: 'Your morning, slower', body: 'Open Azora for a quick reset before the noise.' },
  { title: 'Set the tone', body: 'One breathing session, then anything else.' },
  { title: 'Five minutes of calm', body: 'Before the day starts pulling — pause here first.' },
  { title: 'A quiet first move', body: 'Open Azora before opening anything else.' },
  { title: 'Ground yourself', body: 'Your nervous system will thank you.' },
  { title: 'Three deep breaths', body: 'We saved you a moment. Take it.' },
  { title: 'Reset before the rush', body: 'A short session goes a long way today.' },
  { title: 'Begin from steady', body: 'Pick a technique. Start small.' },
  { title: 'Morning check-in', body: 'How does your breath feel right now?' },
  { title: 'Slow it down', body: 'One session, then everything else.' },
  { title: 'Open with intent', body: 'Choose calm before the day chooses for you.' },
  { title: "Today's first breath", body: 'Make it a good one.' },
];

const EVENING_VARIANTS: DailyReminderVariant[] = [
  { title: 'Wind down with Azora', body: 'Complete a short breathing session before the day ends.' },
  { title: 'Soften the edges', body: 'A few minutes of slow breath before bed.' },
  { title: 'Close the day out', body: 'One session to let the day settle.' },
  { title: 'Breathe before sleep', body: 'Slow exhales make a real difference.' },
  { title: 'Decompress', body: 'Trade the screen for your breath, just briefly.' },
  { title: 'Slow your evening', body: 'A short session, then rest comes easier.' },
  { title: 'Let it go', body: 'End the day with a calm exhale.' },
  { title: 'Sleep starts here', body: 'Three minutes of breath before lights out.' },
  { title: 'Quiet the night', body: 'Bring your heart rate down gently.' },
  { title: 'Reset before bed', body: 'Tomorrow starts better when tonight winds down.' },
  { title: 'Evening check-in', body: 'Has the day let go of you? Help it.' },
  { title: 'Drop the day', body: 'One technique, then you are free.' },
  { title: 'Easier into sleep', body: 'Slow breath now, deeper sleep later.' },
  { title: 'A gentle off-switch', body: 'Press pause on today.' },
];

const MORNING_CUTOFF_HOUR = 14;

export function buildDailyReminderContent(
  hour: number,
  dayIndex: number,
): NotificationContentDefinition {
  const isMorning = hour < MORNING_CUTOFF_HOUR;
  const pool = isMorning ? MORNING_VARIANTS : EVENING_VARIANTS;
  const index = normalizeIndex(dayIndex, pool.length);
  const variant = pool[index];
  const kind: ScheduledNotificationKind = isMorning
    ? 'daily_reminder_morning'
    : 'daily_reminder_evening';

  return {
    title: variant.title,
    body: variant.body,
    data: {
      notification_kind: kind,
      destination: 'DailyExercise',
      variant_index: String(index),
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

export function getDailyReminderVariantCount(hour: number): number {
  return hour < MORNING_CUTOFF_HOUR ? MORNING_VARIANTS.length : EVENING_VARIANTS.length;
}

function normalizeIndex(dayIndex: number, length: number): number {
  if (!Number.isFinite(dayIndex) || length <= 0) return 0;
  return ((Math.floor(dayIndex) % length) + length) % length;
}
