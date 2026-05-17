import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-notifications';
import {
  NOTIFICATION_CHANNELS,
} from './notificationCatalog';
import { trackNotificationTapped } from '../analytics/tracking';
import type { NotificationPermissionStatus } from './types';

let foregroundHandlerRegistered = false;
let responseSubscription: EventSubscription | null = null;

export function registerNotificationHandler(): void {
  registerForegroundNotificationHandler();
}

export function registerForegroundNotificationHandler(): void {
  if (foregroundHandlerRegistered) return;
  foregroundHandlerRegistered = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function registerNotificationResponseHandler(): () => void {
  if (responseSubscription != null) {
    return unregisterNotificationResponseHandler;
  }

  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(response);
  });

  handleLastNotificationResponse();

  return unregisterNotificationResponseHandler;
}

export function unregisterNotificationResponseHandler(): void {
  responseSubscription?.remove();
  responseSubscription = null;
}

function handleLastNotificationResponse(): void {
  try {
    const response = Notifications.getLastNotificationResponse();
    if (response == null) return;

    handleNotificationResponse(response);
    Notifications.clearLastNotificationResponse();
  } catch (error) {
    console.warn('[notifications] last response handling failed', error);
  }
}

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return;
  }

  const data = response.notification.request.content.data ?? {};
  const kind = typeof data.notification_kind === 'string' ? data.notification_kind : null;
  if (kind == null) return;

  const variantRaw = data.variant_index;
  const variantIndex =
    typeof variantRaw === 'string' && variantRaw.length > 0
      ? Number(variantRaw)
      : null;

  trackNotificationTapped({
    notification_kind: kind,
    variant_index:
      variantIndex != null && Number.isFinite(variantIndex) ? variantIndex : null,
    destination: typeof data.destination === 'string' ? data.destination : null,
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
