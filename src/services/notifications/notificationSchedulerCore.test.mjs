import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDesiredNotificationSchedule,
  getTrialFinalMorningDate,
} from './notificationSchedulerCore.ts';

const basePreferences = {
  dailyReminders: {
    morning: { enabled: false, time: '08:00' },
    evening: { enabled: false, time: '20:30' },
  },
  trialEndingReminder: { enabled: true },
};

test('buildDesiredNotificationSchedule creates enabled daily reminders', () => {
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyReminders: {
        morning: { enabled: true, time: '07:15' },
        evening: { enabled: true, time: '21:45' },
      },
    },
    trialEndsAt: null,
    now: new Date('2026-05-16T12:00:00.000Z'),
  });

  assert.equal(schedule.length, 2);
  assert.deepEqual(
    schedule.map((item) => [item.stableId, item.trigger]),
    [
      ['azora:daily:morning', { type: 'daily', hour: 7, minute: 15 }],
      ['azora:daily:evening', { type: 'daily', hour: 21, minute: 45 }],
    ],
  );
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
