import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cancelScheduledNotification,
  ensureNotificationChannels,
  getNotificationPermissionStatus,
  registerNotificationHandler,
  scheduleDailyNotification,
  scheduleDateNotification,
} from './notificationClient';
import { buildDesiredNotificationSchedule } from './notificationSchedulerCore';
import type { NotificationPreferences } from './types';

const SCHEDULED_IDS_KEY = 'notifications:scheduled_ids_v1';

type ScheduledIdMap = Record<string, string>;

export async function reconcileScheduledNotifications(input: {
  preferences: NotificationPreferences;
  trialEndsAt: string | null;
}): Promise<void> {
  registerNotificationHandler();
  await ensureNotificationChannels();

  const permissionStatus = await getNotificationPermissionStatus();
  if (permissionStatus !== 'granted') {
    await cancelStoredNotifications();
    return;
  }

  const desired = buildDesiredNotificationSchedule(input);
  const currentIds = await loadScheduledIds();
  const nextIds: ScheduledIdMap = {};

  await Promise.all(
    Object.entries(currentIds)
      .filter(([stableId]) => desired.every((item) => item.stableId !== stableId))
      .map(([, notificationId]) => cancelScheduledNotification(notificationId)),
  );

  for (const item of desired) {
    const existingId = currentIds[item.stableId];
    if (existingId != null) {
      await cancelScheduledNotification(existingId);
    }

    const notificationId =
      item.trigger.type === 'daily'
        ? await scheduleDailyNotification({
            identifier: item.stableId,
            title: item.title,
            body: item.body,
            data: item.data,
            channelId: item.channelId,
            hour: item.trigger.hour,
            minute: item.trigger.minute,
          })
        : await scheduleDateNotification({
            identifier: item.stableId,
            title: item.title,
            body: item.body,
            data: item.data,
            channelId: item.channelId,
            date: item.trigger.date,
          });

    nextIds[item.stableId] = notificationId;
  }

  await saveScheduledIds(nextIds);
}

export async function cancelStoredNotifications(): Promise<void> {
  const currentIds = await loadScheduledIds();
  await Promise.all(
    Object.values(currentIds).map((notificationId) =>
      cancelScheduledNotification(notificationId),
    ),
  );
  await saveScheduledIds({});
}

async function loadScheduledIds(): Promise<ScheduledIdMap> {
  const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
  if (raw == null) return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}

async function saveScheduledIds(ids: ScheduledIdMap): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}
