import type { DesiredScheduledNotification } from './notificationSchedulerCore';

export interface ScheduledNotificationRecord {
  notificationId: string;
  fireAt: string;
  title: string;
  body: string;
  channelId: string;
  data: Record<string, string>;
}

export type ScheduledNotificationRecordMap = Record<string, ScheduledNotificationRecord>;

export function buildScheduledNotificationRecord(
  item: DesiredScheduledNotification,
  notificationId: string,
): ScheduledNotificationRecord {
  return {
    notificationId,
    fireAt: item.trigger.date.toISOString(),
    title: item.title,
    body: item.body,
    channelId: item.channelId,
    data: { ...item.data },
  };
}

export function isScheduledNotificationRecordCurrent(
  record: ScheduledNotificationRecord | undefined,
  item: DesiredScheduledNotification,
): boolean {
  if (record == null) return false;

  return (
    record.fireAt === item.trigger.date.toISOString() &&
    record.title === item.title &&
    record.body === item.body &&
    record.channelId === item.channelId &&
    areStringRecordsEqual(record.data, item.data)
  );
}

export function sanitizeScheduledNotificationRecordMap(
  raw: unknown,
): ScheduledNotificationRecordMap {
  if (raw == null || typeof raw !== 'object') return {};

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .map(([stableId, value]) => [stableId, sanitizeScheduledRecord(value)] as const)
      .filter((entry): entry is [string, ScheduledNotificationRecord] => entry[1] != null),
  );
}

function sanitizeScheduledRecord(raw: unknown): ScheduledNotificationRecord | null {
  if (raw == null || typeof raw !== 'object') return null;

  const record = raw as Partial<ScheduledNotificationRecord>;
  if (
    typeof record.notificationId !== 'string' ||
    typeof record.fireAt !== 'string' ||
    typeof record.title !== 'string' ||
    typeof record.body !== 'string' ||
    typeof record.channelId !== 'string'
  ) {
    return null;
  }

  return {
    notificationId: record.notificationId,
    fireAt: record.fireAt,
    title: record.title,
    body: record.body,
    channelId: record.channelId,
    data: sanitizeStringRecord(record.data),
  };
}

function sanitizeStringRecord(raw: unknown): Record<string, string> {
  if (raw == null || typeof raw !== 'object') return {};

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' && typeof entry[1] === 'string',
    ),
  );
}

function areStringRecordsEqual(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const aEntries = Object.entries(a);
  const bEntries = Object.entries(b);
  if (aEntries.length !== bEntries.length) return false;

  return aEntries.every(([key, value]) => b[key] === value);
}
