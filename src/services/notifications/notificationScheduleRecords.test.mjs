import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScheduledNotificationRecord,
  isScheduledNotificationRecordCurrent,
  sanitizeScheduledNotificationRecordMap,
} from './notificationScheduleRecords.ts';

const baseItem = {
  stableId: 'azora:daily:morning:2026-05-16',
  kind: 'daily_reminder_morning',
  title: 'Take a breathing reset',
  body: 'A few minutes now can set the tone for your day.',
  data: {
    notification_kind: 'daily_reminder_morning',
    destination: 'DailyExercise',
    variant_index: '0',
  },
  channelId: 'daily-reminders',
  trigger: {
    type: 'date',
    date: new Date(2026, 4, 16, 8, 0, 0),
  },
};

test('buildScheduledNotificationRecord captures the fields used to detect churn', () => {
  const record = buildScheduledNotificationRecord(baseItem, 'native-id-1');

  assert.deepEqual(record, {
    notificationId: 'native-id-1',
    fireAt: baseItem.trigger.date.toISOString(),
    title: baseItem.title,
    body: baseItem.body,
    channelId: baseItem.channelId,
    data: baseItem.data,
  });
});

test('isScheduledNotificationRecordCurrent keeps unchanged scheduled notifications', () => {
  const record = buildScheduledNotificationRecord(baseItem, 'native-id-1');

  assert.equal(isScheduledNotificationRecordCurrent(record, baseItem), true);
});

test('isScheduledNotificationRecordCurrent detects changed notification content', () => {
  const record = buildScheduledNotificationRecord(baseItem, 'native-id-1');

  assert.equal(
    isScheduledNotificationRecordCurrent(record, {
      ...baseItem,
      title: 'Changed title',
    }),
    false,
  );
  assert.equal(
    isScheduledNotificationRecordCurrent(record, {
      ...baseItem,
      data: {
        ...baseItem.data,
        variant_index: '1',
      },
    }),
    false,
  );
  assert.equal(
    isScheduledNotificationRecordCurrent(record, {
      ...baseItem,
      trigger: {
        type: 'date',
        date: new Date(2026, 4, 16, 8, 30, 0),
      },
    }),
    false,
  );
});

test('sanitizeScheduledNotificationRecordMap keeps valid records and drops malformed ones', () => {
  const valid = buildScheduledNotificationRecord(baseItem, 'native-id-1');
  const sanitized = sanitizeScheduledNotificationRecordMap({
    [baseItem.stableId]: {
      ...valid,
      data: {
        ...valid.data,
        ignored_number: 1,
      },
    },
    invalid: {
      notificationId: 12,
      fireAt: valid.fireAt,
      title: valid.title,
      body: valid.body,
      channelId: valid.channelId,
      data: valid.data,
    },
  });

  assert.deepEqual(sanitized, {
    [baseItem.stableId]: valid,
  });
});
