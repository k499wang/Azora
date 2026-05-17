import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDesiredNotificationSchedule,
  getEpochDayIndex,
  getTrialFinalMorningDate,
} from './notificationSchedulerCore.ts';
import {
  buildDailyReminderContent,
  getDailyReminderVariantCount,
} from './notificationCatalog.ts';

const basePreferences = {
  dailyReminder: { enabled: false, time: '08:00' },
  trialEndingReminder: { enabled: true },
};

test('buildDesiredNotificationSchedule batches 14 future days for the daily reminder', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyReminder: { enabled: true, time: '07:15' },
    },
    trialEndsAt: null,
    now,
  });

  assert.equal(schedule.length, 14);
  for (const item of schedule) {
    assert.equal(item.trigger.type, 'date');
    assert.equal(item.trigger.date.getHours(), 7);
    assert.equal(item.trigger.date.getMinutes(), 15);
    assert.ok(item.stableId.startsWith('azora:daily:'));
    assert.equal(item.kind, 'daily_reminder_morning');
  }

  const ids = new Set(schedule.map((item) => item.stableId));
  assert.equal(ids.size, 14);
});

test('evening time selects the evening variant pool', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyReminder: { enabled: true, time: '20:30' },
    },
    trialEndsAt: null,
    now,
  });

  for (const item of schedule) {
    assert.equal(item.kind, 'daily_reminder_evening');
  }
});

test('buildDesiredNotificationSchedule skips today when the local time has already passed', () => {
  const now = new Date(2026, 4, 16, 9, 0, 0);
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyReminder: { enabled: true, time: '07:15' },
    },
    trialEndsAt: null,
    now,
  });

  assert.equal(schedule.length, 13);
  assert.equal(schedule[0].trigger.date.getDate(), 17);
});

test('buildDailyReminderContent rotates deterministically by day index within the chosen pool', () => {
  const length = getDailyReminderVariantCount(7);
  const first = buildDailyReminderContent(7, 0);
  const wrap = buildDailyReminderContent(7, length);
  const next = buildDailyReminderContent(7, 1);

  assert.equal(first.title, wrap.title);
  assert.notEqual(first.title, next.title);
  assert.equal(first.data.variant_index, '0');
  assert.equal(next.data.variant_index, '1');
});

test('consecutive days produce different variants in the schedule', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyReminder: { enabled: true, time: '08:00' },
    },
    trialEndsAt: null,
    now,
  });

  assert.notEqual(schedule[0].title, schedule[1].title);
  assert.equal(
    Number(schedule[1].data.variant_index) -
      Number(schedule[0].data.variant_index),
    1,
  );
});

test('getEpochDayIndex returns stable UTC day counter', () => {
  const a = new Date('2026-05-16T05:00:00.000Z');
  const b = new Date('2026-05-16T23:30:00.000Z');
  const c = new Date('2026-05-17T00:30:00.000Z');

  assert.equal(getEpochDayIndex(a), getEpochDayIndex(b));
  assert.equal(getEpochDayIndex(c) - getEpochDayIndex(a), 1);
});

test('getTrialFinalMorningDate schedules the morning of the local final day', () => {
  const now = new Date(2026, 4, 16, 8, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();
  const reminder = getTrialFinalMorningDate(trialEndsAt, now);

  assert.ok(reminder);
  assert.equal(reminder.getFullYear(), 2026);
  assert.equal(reminder.getMonth(), 4);
  assert.equal(reminder.getDate(), 18);
  assert.equal(reminder.getHours(), 9);
  assert.equal(reminder.getMinutes(), 0);
});

test('getTrialFinalMorningDate catches up if final morning already passed', () => {
  const now = new Date(2026, 4, 18, 10, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();
  const reminder = getTrialFinalMorningDate(trialEndsAt, now);

  assert.ok(reminder);
  assert.equal(reminder.getTime(), now.getTime() + 5 * 60 * 1000);
});

test('getTrialFinalMorningDate skips expired trials', () => {
  const now = new Date(2026, 4, 18, 18, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();

  assert.equal(getTrialFinalMorningDate(trialEndsAt, now), null);
});
