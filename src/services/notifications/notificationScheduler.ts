import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cancelScheduledNotification,
  ensureNotificationChannels,
  getNotificationPermissionStatus,
  registerNotificationHandler,
  scheduleDateNotification,
} from './notificationClient';
import { buildDesiredNotificationSchedule } from './notificationSchedulerCore';
import {
  buildScheduledNotificationRecord,
  isScheduledNotificationRecordCurrent,
  sanitizeScheduledNotificationRecordMap,
  type ScheduledNotificationRecordMap,
} from './notificationScheduleRecords';
import { trackNotificationScheduled } from '../analytics/tracking';
import { createSerializedAsync } from '../../lib/serializedAsync';
import type { NotificationPreferences } from './types';

const LEGACY_SCHEDULED_IDS_KEY = 'notifications:scheduled_ids_v1';
const SCHEDULED_RECORDS_KEY = 'notifications:scheduled_records_v2';

const reconcileQueue = createSerializedAsync();

export function reconcileScheduledNotifications(input: {
  preferences: NotificationPreferences;
  trialEndsAt: string | null;
}): Promise<void> {
  return reconcileQueue.run(() => performReconcile(input));
}

async function performReconcile(input: {
  preferences: NotificationPreferences;
  trialEndsAt: string | null;
}): Promise<void> {
  registerNotificationHandler();
  await ensureNotificationChannels();

  const permissionStatus = await getNotificationPermissionStatus();
  if (permissionStatus !== 'granted') {
    await performCancelStoredNotifications();
    return;
  }

  await cancelLegacyStoredNotifications();

  const desired = buildDesiredNotificationSchedule(input);
  const currentRecords = await loadScheduledRecords();
  const nextRecords: ScheduledNotificationRecordMap = {};

  await Promise.all(
    Object.entries(currentRecords)
      .filter(([stableId]) => desired.every((item) => item.stableId !== stableId))
      .map(([, record]) => cancelScheduledNotification(record.notificationId)),
  );

  for (const item of desired) {
    const existingRecord = currentRecords[item.stableId];
    if (isScheduledNotificationRecordCurrent(existingRecord, item)) {
      nextRecords[item.stableId] = existingRecord;
      continue;
    }

    const isNew = existingRecord == null;
    if (existingRecord != null) {
      await cancelScheduledNotification(existingRecord.notificationId);
    }

    const notificationId = await scheduleDateNotification({
      identifier: item.stableId,
      title: item.title,
      body: item.body,
      data: item.data,
      channelId: item.channelId,
      date: item.trigger.date,
    });

    nextRecords[item.stableId] = buildScheduledNotificationRecord(item, notificationId);

    if (isNew) {
      const variantRaw = item.data.variant_index;
      const variantIndex =
        typeof variantRaw === 'string' && variantRaw.length > 0
          ? Number(variantRaw)
          : null;

      trackNotificationScheduled({
        notification_kind: item.kind,
        variant_index:
          variantIndex != null && Number.isFinite(variantIndex) ? variantIndex : null,
        destination: item.data.destination ?? null,
        fire_at: item.trigger.date.toISOString(),
        stable_id: item.stableId,
      });
    }
  }

  await saveScheduledRecords(nextRecords);
}

export function cancelStoredNotifications(): Promise<void> {
  return reconcileQueue.run(() => performCancelStoredNotifications());
}

async function performCancelStoredNotifications(): Promise<void> {
  const currentRecords = await loadScheduledRecords();
  const legacyIds = await loadLegacyScheduledIds();
  await Promise.all(
    [
      ...Object.values(currentRecords).map((record) => record.notificationId),
      ...Object.values(legacyIds),
    ].map((notificationId) =>
      cancelScheduledNotification(notificationId),
    ),
  );
  await saveScheduledRecords({});
  await AsyncStorage.removeItem(LEGACY_SCHEDULED_IDS_KEY);
}

async function cancelLegacyStoredNotifications(): Promise<void> {
  const legacyIds = await loadLegacyScheduledIds();
  await Promise.all(
    Object.values(legacyIds).map((notificationId) =>
      cancelScheduledNotification(notificationId),
    ),
  );
  await AsyncStorage.removeItem(LEGACY_SCHEDULED_IDS_KEY);
}

async function loadScheduledRecords(): Promise<ScheduledNotificationRecordMap> {
  const raw = await AsyncStorage.getItem(SCHEDULED_RECORDS_KEY);
  if (raw == null) return {};

  try {
    return sanitizeScheduledNotificationRecordMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function saveScheduledRecords(records: ScheduledNotificationRecordMap): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_RECORDS_KEY, JSON.stringify(records));
}

async function loadLegacyScheduledIds(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(LEGACY_SCHEDULED_IDS_KEY);
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
