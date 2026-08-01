import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScheduledNotificationRecord,
  getObsoleteScheduledNotificationIds,
  isScheduledNotificationRecordCurrent,
  sanitizeScheduledNotificationRecordMap,
} from './notificationScheduleRecords.ts';

const baseItem = {
  stableId: 'azora:daily:session:2026-05-16',
  kind: 'daily_plan_session',
  title: 'Time for guided breathing',
  body: 'Your guided breathing exercise is ready.',
  data: {
    notification_kind: 'daily_plan_session',
    reminder_action: 'session',
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
        reminder_action: 'handPicked',
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

test('legacy single-reminder records are replaced by the three-reminder schedule', () => {
  const legacyStableId = 'azora:daily:2026-05-16';
  const legacyRecord = {
    notificationId: 'native-legacy-daily',
    fireAt: baseItem.trigger.date.toISOString(),
    title: 'Take a breathing reset',
    body: 'A few minutes now can set the tone for your day.',
    channelId: 'daily-reminders',
    data: {
      notification_kind: 'daily_reminder_morning',
      destination: 'DailyExercise',
      variant_index: '0',
    },
  };
  const desired = [
    baseItem,
    {
      ...baseItem,
      stableId: 'azora:daily:handPicked:2026-05-16',
      kind: 'daily_plan_hand_picked',
      data: {
        notification_kind: 'daily_plan_hand_picked',
        reminder_action: 'handPicked',
      },
    },
    {
      ...baseItem,
      stableId: 'azora:daily:checkIn:2026-05-16',
      kind: 'daily_plan_check_in',
      data: {
        notification_kind: 'daily_plan_check_in',
        reminder_action: 'checkIn',
      },
    },
  ];
  const currentRecords = { [legacyStableId]: legacyRecord };

  assert.deepEqual(
    getObsoleteScheduledNotificationIds(currentRecords, desired),
    ['native-legacy-daily'],
  );
  assert.ok(
    desired.every(
      (item) =>
        !isScheduledNotificationRecordCurrent(
          currentRecords[item.stableId],
          item,
        ),
    ),
  );
});
