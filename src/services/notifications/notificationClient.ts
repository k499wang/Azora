import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  NOTIFICATION_CHANNELS,
} from './notificationCatalog';
import type { NotificationPermissionStatus } from './types';

let handlerRegistered = false;

export function registerNotificationHandler(): void {
  if (handlerRegistered) return;
  handlerRegistered = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.dailyReminders, {
      name: 'Daily reminders',
      description: 'Morning and evening breathing practice reminders.',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      enableVibrate: true,
      showBadge: false,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.billing, {
      name: 'Subscription reminders',
      description: 'Trial and subscription account reminders.',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      enableVibrate: true,
      showBadge: false,
    }),
  ]);
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const permissions = await Notifications.getPermissionsAsync();
  return toPermissionStatus(permissions.status);
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
  await ensureNotificationChannels();
  const permissions = await Notifications.requestPermissionsAsync();
  return toPermissionStatus(permissions.status);
}

export async function scheduleDailyNotification(input: {
  identifier: string;
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
  hour: number;
  minute: number;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier: input.identifier,
    content: {
      title: input.title,
      body: input.body,
      data: input.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: input.channelId,
      hour: input.hour,
      minute: input.minute,
    },
  });
}

export async function scheduleDateNotification(input: {
  identifier: string;
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
  date: Date;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier: input.identifier,
    content: {
      title: input.title,
      body: input.body,
      data: input.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      channelId: input.channelId,
      date: input.date,
    },
  });
}

export function cancelScheduledNotification(identifier: string): Promise<void> {
  return Notifications.cancelScheduledNotificationAsync(identifier);
}

function toPermissionStatus(status: Notifications.PermissionStatus): NotificationPermissionStatus {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}
