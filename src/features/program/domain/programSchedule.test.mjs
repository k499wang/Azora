import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROGRAM_SLOT_ORDER,
  SLOTS_WITHOUT_A_PROGRAM,
  programSlotAt,
  programSlotsInUse,
} from './programSchedule.ts';
import { buildDesiredNotificationSchedule } from '../../../services/notifications/notificationSchedulerCore.ts';

test('each position in the day takes its own hour, in order', () => {
  assert.deepEqual(PROGRAM_SLOT_ORDER, ['session', 'handPicked', 'windDown']);
  assert.equal(programSlotAt(0), 'session');
  assert.equal(programSlotAt(2), 'windDown');
  assert.equal(programSlotAt(3), null);
});

test('a day only uses as many hours as it has exercises', () => {
  assert.deepEqual(programSlotsInUse(1), ['session']);
  assert.deepEqual(programSlotsInUse(2), ['session', 'handPicked']);
  assert.deepEqual(programSlotsInUse(3), ['session', 'handPicked', 'windDown']);
});

test('a nonsense count uses no hours rather than all of them', () => {
  for (const count of [0, -1, Number.NaN]) {
    assert.deepEqual(programSlotsInUse(count), []);
  }
  // Never more slots than there are.
  assert.deepEqual(programSlotsInUse(99), PROGRAM_SLOT_ORDER);
});

test('a user with no plan keeps exactly the two reminders they have today', () => {
  assert.deepEqual(SLOTS_WITHOUT_A_PROGRAM, ['session', 'handPicked']);
});

const schedule = {
  version: 1,
  timeMode: 'device_local',
  actions: { session: '07:15', handPicked: '13:30', windDown: '20:45' },
};

const allEnabled = {
  dailyPlanReminders: {
    session: { enabled: true },
    handPicked: { enabled: true },
    windDown: { enabled: true },
  },
  trialEndingReminder: { enabled: false },
};

const actionsIn = (entries) =>
  [...new Set(entries.map((item) => item.data.reminder_action))].sort();

/**
 * The reason the gate exists. The evening hour is written at onboarding and sits
 * unused for weeks; without this, week one books a nightly reminder for an
 * exercise the plan does not hand over until day eighteen.
 */
test('a one-exercise day books nothing for the hours it does not use', () => {
  const entries = buildDesiredNotificationSchedule({
    preferences: allEnabled,
    dailyPlanSchedule: schedule,
    trialEndsAt: null,
    now: new Date(2026, 4, 16, 6, 0, 0),
    slotsInUse: programSlotsInUse(1),
  });

  assert.deepEqual(actionsIn(entries), ['session']);
});

test('the evening reminder starts booking the day the plan grows into it', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const before = buildDesiredNotificationSchedule({
    preferences: allEnabled,
    dailyPlanSchedule: schedule,
    trialEndsAt: null,
    now,
    slotsInUse: programSlotsInUse(2),
  });
  const after = buildDesiredNotificationSchedule({
    preferences: allEnabled,
    dailyPlanSchedule: schedule,
    trialEndsAt: null,
    now,
    slotsInUse: programSlotsInUse(3),
  });

  assert.deepEqual(actionsIn(before), ['handPicked', 'session']);
  assert.deepEqual(actionsIn(after), ['handPicked', 'session', 'windDown']);
});

test('a used hour with its switch off still books nothing', () => {
  const entries = buildDesiredNotificationSchedule({
    preferences: {
      ...allEnabled,
      dailyPlanReminders: {
        ...allEnabled.dailyPlanReminders,
        windDown: { enabled: false },
      },
    },
    dailyPlanSchedule: schedule,
    trialEndsAt: null,
    now: new Date(2026, 4, 16, 6, 0, 0),
    slotsInUse: programSlotsInUse(3),
  });

  assert.deepEqual(actionsIn(entries), ['handPicked', 'session']);
});

test('a user with no plan never books the evening reminder, switch or not', () => {
  const entries = buildDesiredNotificationSchedule({
    preferences: allEnabled,
    dailyPlanSchedule: schedule,
    trialEndsAt: null,
    now: new Date(2026, 4, 16, 6, 0, 0),
    slotsInUse: SLOTS_WITHOUT_A_PROGRAM,
  });

  assert.deepEqual(actionsIn(entries), ['handPicked', 'session']);
});
