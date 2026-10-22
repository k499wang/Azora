import {
  cancelScheduledNotification,
  scheduleDateNotification,
} from '../../services/notifications/notificationClient';
import { NOTIFICATION_CHANNELS } from '../../services/notifications/notificationCatalog';

const IDENTIFIER = 'routine-step-time-up';

/** Rings while the phone is locked or the app is away, when the running step's time is up. */
export function scheduleRoutineStepAlert(input: {
  stepTitle: string;
  nextTitle: string | null;
  at: Date;
}): void {
  scheduleDateNotification({
    identifier: IDENTIFIER,
    title: `Time's up: ${input.stepTitle}`,
    body: input.nextTitle == null ? 'That was the last one. Tap to finish.' : `Next up: ${input.nextTitle}`,
    data: { notification_kind: 'routine_step', destination: 'RoutinePlayer' },
    channelId: NOTIFICATION_CHANNELS.dailyReminders,
    date: input.at,
  }).catch(() => {});
}

export function cancelRoutineStepAlert(): void {
  cancelScheduledNotification(IDENTIFIER).catch(() => {});
}
