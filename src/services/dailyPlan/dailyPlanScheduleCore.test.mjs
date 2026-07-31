import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDailyPlanTime,
  normalizeDailyPlanTime,
  sanitizeDailyPlanSchedule,
  sortDailyPlanActionIdsByTime,
} from './dailyPlanScheduleCore.ts';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from './types.ts';

test('accepts a valid version-one device-local schedule', () => {
  const schedule = {
    version: 1,
    timeMode: 'device_local',
    actions: {
      session: '09:15',
      handPicked: '13:30',
      checkIn: '20:45',
    },
  };

  assert.deepEqual(sanitizeDailyPlanSchedule(schedule), schedule);
});

test('missing or invalid schedule data returns the complete default', () => {
  assert.deepEqual(
    sanitizeDailyPlanSchedule(null),
    DEFAULT_DAILY_PLAN_SCHEDULE,
  );
  assert.deepEqual(
    sanitizeDailyPlanSchedule({ version: 2, timeMode: 'device_local' }),
    DEFAULT_DAILY_PLAN_SCHEDULE,
  );
});

test('normalizes optional seconds and falls back only invalid action times', () => {
  assert.deepEqual(
    sanitizeDailyPlanSchedule({
      version: 1,
      timeMode: 'device_local',
      actions: {
        session: '09:15:30',
        handPicked: '25:00',
        checkIn: '07:05:00',
      },
    }),
    {
      version: 1,
      timeMode: 'device_local',
      actions: {
        session: '09:15',
        handPicked: '13:00',
        checkIn: '07:05',
      },
    },
  );
});

test('formats clock times for cards and safely handles malformed values', () => {
  assert.equal(formatDailyPlanTime('00:00', '08:00'), '12:00 AM');
  assert.equal(formatDailyPlanTime('13:05:00', '08:00'), '1:05 PM');
  assert.equal(formatDailyPlanTime('not-a-time', '18:00'), '6:00 PM');
  assert.equal(normalizeDailyPlanTime('23:59:59', '08:00'), '23:59');
});

test('sorts daily actions chronologically regardless of configured order', () => {
  assert.deepEqual(
    sortDailyPlanActionIdsByTime({
      session: '18:00',
      handPicked: '13:00',
      checkIn: '08:00',
    }),
    ['checkIn', 'handPicked', 'session'],
  );
  assert.deepEqual(
    sortDailyPlanActionIdsByTime({
      session: '21:30',
      handPicked: '07:15',
      checkIn: '12:00',
    }),
    ['handPicked', 'checkIn', 'session'],
  );
});

test('sorts normalized times and uses stable action order for ties', () => {
  assert.deepEqual(
    sortDailyPlanActionIdsByTime({
      session: '09:00:30',
      handPicked: '09:00',
      checkIn: '09:00:59',
    }),
    ['session', 'handPicked', 'checkIn'],
  );
});

test('uses each action default when an ordering time is malformed', () => {
  assert.deepEqual(
    sortDailyPlanActionIdsByTime({
      session: 'bad',
      handPicked: '25:00',
      checkIn: null,
    }),
    ['session', 'handPicked', 'checkIn'],
  );
});
