import {
  cancelScheduledNotification,
  scheduleDateNotification,
} from '../../../services/notifications/notificationClient';
import { buildTaskTimerContent } from '../../../services/notifications/notificationCatalog';
import { createSerializedAsync } from '../../../lib/serializedAsync';

const queue = createSerializedAsync();

type TimerKind = 'routine' | 'focus';
const identifiers: Record<TimerKind, string> = {
  routine: 'routine-step-time-up',
  focus: 'focus-timer-time-up',
};

export function scheduleTaskTimerAlert(input: {
  kind: TimerKind;
  title: string;
  nextTitle: string | null;
  at: Date;
}): void {
  queue.run(() => scheduleDateNotification({
    identifier: identifiers[input.kind],
    ...buildTaskTimerContent(input),
    date: input.at,
  })).catch(() => {});
}

export function cancelTaskTimerAlert(kind: TimerKind): void {
  queue.run(() => cancelScheduledNotification(identifiers[kind])).catch(() => {});
}
