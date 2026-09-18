/**
 * Upgrading past the removed third daily.
 *
 * Every one of these values was written by a build that had a `checkIn` daily
 * and outlives it: the schedule row, the drag order, the Today arrangement and
 * the reminder switches. None of them may be trusted to describe this build's
 * day, and none of them may strand the user on a list that no longer exists.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeDailyPlanSchedule,
  sanitizeDailyPlanOrder,
  resolveDailyPlanOrder,
} from './dailyPlanScheduleCore.ts';
import {
  reconcileTodayJourneyOrder,
  defaultTodayJourneyOrder,
} from '../../components/home/journey/todayJourneyOrder.ts';
import { sanitizeNotificationPreferences } from '../notifications/notificationPreferencesCore.ts';

test('UPGRADE: a stored v1 schedule containing checkIn is read without it', () => {
  const legacy = {
    version: 1,
    timeMode: 'device_local',
    actions: { session: '06:45', handPicked: '12:15', checkIn: '19:30' },
  };
  const out = sanitizeDailyPlanSchedule(legacy);
  assert.equal(out.actions.session, '06:45');
  assert.equal(out.actions.handPicked, '12:15');
  assert.equal('checkIn' in out.actions, false);
  // The slot the third exercise uses did not exist then, so it defaults.
  assert.equal(out.actions.windDown, '21:00');
});

test('UPGRADE: a stored three-daily drag order is refused, not half-applied', () => {
  assert.equal(sanitizeDailyPlanOrder(['checkIn', 'session', 'handPicked']), null);
  assert.deepEqual(
    resolveDailyPlanOrder(['checkIn', 'session', 'handPicked'], {
      session: '18:00',
      handPicked: '09:00',
      windDown: '21:00',
    }),
    ['handPicked', 'session', 'windDown'],
  );
});

test('UPGRADE: a saved Today order drops exercise:checkIn and keeps the rest', () => {
  const goals = [{ id: 'g1', scheduledTime: '10:00', createdAt: 'g1' }];
  const defaults = defaultTodayJourneyOrder(
    { session: '08:00', handPicked: '13:00', windDown: '21:00' },
    goals,
  );
  const stored = [
    'exercise:checkIn',
    'todo:g1',
    'exercise:handPicked',
    'exercise:session',
  ];
  const out = reconcileTodayJourneyOrder(stored, defaults, null, {});
  assert.equal(out.includes('exercise:checkIn'), false);
  assert.deepEqual(out, [
    'todo:g1',
    'exercise:handPicked',
    'exercise:session',
    'exercise:windDown',
  ]);
});

test('UPGRADE: stored notification prefs with checkIn drop it and keep the rest', () => {
  const out = sanitizeNotificationPreferences({
    dailyPlanReminders: {
      session: { enabled: true },
      handPicked: { enabled: true },
      checkIn: { enabled: true },
    },
    trialEndingReminder: { enabled: true },
  });
  assert.deepEqual(out.dailyPlanReminders, {
    session: { enabled: true },
    handPicked: { enabled: true },
    // Added after that row was written, so it takes its own default.
    windDown: { enabled: false },
  });
  assert.equal(out.trialEndingReminder.enabled, true);
});
