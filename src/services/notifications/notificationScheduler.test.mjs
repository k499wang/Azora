import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { dailyReminderDefinitionsFor } from './notificationCatalog.ts';
import { buildDesiredNotificationSchedule } from './notificationSchedulerCore.ts';
import * as records from './notificationScheduleRecords.ts';
import { createSerializedAsync } from '../../lib/serializedAsync.ts';

const RECORDS_KEY = 'notifications:scheduled_records_v2';
const now = new Date(2026, 4, 16, 6);
const input = {
  preferences: {
    dailyPlanReminders: {
      session: { enabled: true }, handPicked: { enabled: true }, windDown: { enabled: true },
    },
    trialEndingReminder: { enabled: false },
  },
  dailyPlanSchedule: {
    version: 1, timeMode: 'device_local',
    actions: { session: '08:15', handPicked: '13:30', windDown: '21:00' },
  },
  trialEndsAt: null,
  dailyReminderDefinitions: dailyReminderDefinitionsFor('focus', 'focus'),
};

const source = ts.transpileModule(
  readFileSync(new URL('./notificationScheduler.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

// Run the production orchestrator with real schedule/diff/queue logic and fake
// device APIs. No native module or production adapter is needed for this test.
function setup({ legacy = false } = {}) {
  const storage = new Map();
  const pending = new Map();
  const scheduled = [];
  const cancelled = [];
  const tracked = [];
  const device = { permission: 'granted', failNextSchedule: false, failAfterSchedules: null, now };
  const desired = buildDesiredNotificationSchedule({ ...input, now }, input.dailyReminderDefinitions);
  if (legacy) {
    const oldRecords = {};
    for (const entry of desired) {
      for (const action of ['session', 'handPicked', 'windDown']) {
        const old = {
          ...entry,
          stableId: entry.stableId.replace(':session:', `:${action}:`),
          data: { ...entry.data, reminder_action: action },
        };
        oldRecords[old.stableId] = records.buildScheduledNotificationRecord(old, old.stableId);
        pending.set(old.stableId, old);
      }
    }
    storage.set(RECORDS_KEY, JSON.stringify(oldRecords));
  }
  const dependencies = {
    '@react-native-async-storage/async-storage': { default: {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => { storage.set(key, value); },
      removeItem: async (key) => { storage.delete(key); },
    } },
    './notificationClient': {
      registerNotificationHandler() {},
      ensureNotificationChannels: async () => {},
      getNotificationPermissionStatus: async () => device.permission,
      cancelScheduledNotification: async (id) => { cancelled.push(id); pending.delete(id); },
      scheduleDateNotification: async (notification) => {
        if (device.failNextSchedule || scheduled.length === device.failAfterSchedules) {
          device.failNextSchedule = false;
          device.failAfterSchedules = null;
          throw new Error('Device scheduling failed');
        }
        assert.equal(pending.has(notification.identifier), false, 'replace must cancel before scheduling');
        scheduled.push(notification);
        pending.set(notification.identifier, notification);
        return notification.identifier;
      },
    },
    './notificationSchedulerCore': {
      buildDesiredNotificationSchedule: (value, definitions) =>
        buildDesiredNotificationSchedule({ ...value, now: device.now }, definitions),
    },
    './notificationScheduleRecords': records,
    '../analytics/tracking': { trackNotificationScheduled: (event) => { tracked.push(event); } },
    '../../lib/serializedAsync': { createSerializedAsync },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return {
    ...exports, pending, scheduled, cancelled, tracked, device,
    saved: () => JSON.parse(storage.get(RECORDS_KEY) ?? '{}'),
  };
}

test('actual reconciliation removes legacy secondary notifications and stays stable for ten refreshes', async () => {
  const state = setup({ legacy: true });
  await state.reconcileScheduledNotifications(input);
  assert.equal(state.cancelled.length, 28);
  assert.equal(state.pending.size, 14);
  assert.equal(Object.keys(state.saved()).length, 14);
  assert.ok([...state.pending.keys()].every((id) => id.includes(':session:')));
  await Promise.all(Array.from({ length: 10 }, () => state.reconcileScheduledNotifications(input)));
  assert.equal(state.scheduled.length, 0, 'unchanged reminders must not be rebooked');
  assert.equal(state.cancelled.length, 28);
  assert.equal(state.tracked.length, 0);
  assert.equal(state.pending.size, 14);
});

test('time and copy edits replace existing reminders, and turning the main switch off clears them', async () => {
  const state = setup();
  await state.reconcileScheduledNotifications(input);
  const changed = {
    ...input,
    dailyPlanSchedule: { ...input.dailyPlanSchedule, actions: { ...input.dailyPlanSchedule.actions, session: '22:15' } },
    dailyReminderDefinitions: dailyReminderDefinitionsFor('sleep', 'night'),
  };
  await state.reconcileScheduledNotifications(changed);
  assert.equal(state.pending.size, 14);
  assert.equal(state.cancelled.length, 14);
  assert.ok(Object.values(state.saved()).every((record) =>
    new Date(record.fireAt).getHours() === 22 &&
    new Date(record.fireAt).getMinutes() === 15 &&
    record.title === 'Your bedtime routine is ready',
  ));
  await state.reconcileScheduledNotifications({
    ...changed,
    preferences: {
      ...input.preferences,
      dailyPlanReminders: { ...input.preferences.dailyPlanReminders, session: { enabled: false } },
    },
  });
  assert.equal(state.pending.size, 0);
  assert.deepEqual(state.saved(), {});
});

test('a new local day refills the window without duplicating retained reminders', async () => {
  const state = setup();
  await state.reconcileScheduledNotifications(input);
  const firstIds = Object.keys(state.saved());
  state.device.now = new Date(2026, 4, 17, 6);
  // The phone has already delivered yesterday's notification.
  for (const [id, notification] of state.pending) {
    if (notification.date <= state.device.now) state.pending.delete(id);
  }
  await state.reconcileScheduledNotifications(input);
  const nextIds = Object.keys(state.saved());
  assert.equal(state.pending.size, 14);
  assert.equal(nextIds.length, 14);
  assert.equal(nextIds.filter((id) => firstIds.includes(id)).length, 13);
  assert.equal(state.scheduled.length, 15, 'only the new final day is booked');
});

test('revoking permission and signing out both cancel stored device notifications', async () => {
  const state = setup();
  await state.reconcileScheduledNotifications(input);
  state.device.permission = 'denied';
  await state.reconcileScheduledNotifications(input);
  assert.equal(state.pending.size, 0);
  assert.deepEqual(state.saved(), {});
  state.device.permission = 'granted';
  await state.reconcileScheduledNotifications(input);
  assert.equal(state.pending.size, 14);
  await state.cancelStoredNotifications();
  assert.equal(state.pending.size, 0);
  assert.deepEqual(state.saved(), {});
});

test('a failed device schedule does not prevent the queued refresh from succeeding', async () => {
  const state = setup();
  state.device.failNextSchedule = true;
  const failed = state.reconcileScheduledNotifications(input);
  const retry = state.reconcileScheduledNotifications(input);
  await assert.rejects(failed, /Device scheduling failed/);
  await retry;
  assert.equal(state.pending.size, 14);
  assert.equal(Object.keys(state.saved()).length, 14);
  assert.equal(state.scheduled.length, 14);
});

test('sign-out clears reminders even when device scheduling fails partway through', async () => {
  const state = setup();
  state.device.failAfterSchedules = 3;
  await assert.rejects(state.reconcileScheduledNotifications(input), /Device scheduling failed/);
  assert.equal(state.pending.size, 3);
  await state.cancelStoredNotifications();
  assert.equal(state.pending.size, 0);
  assert.deepEqual(state.saved(), {});
});

test('retrying a partial schedule keeps successful reminders without booking duplicates', async () => {
  const state = setup();
  state.device.failAfterSchedules = 3;
  await assert.rejects(state.reconcileScheduledNotifications(input), /Device scheduling failed/);
  await state.reconcileScheduledNotifications(input);
  assert.equal(state.pending.size, 14);
  assert.equal(state.scheduled.length, 14);
  assert.equal(Object.keys(state.saved()).length, 14);
});

test('turning the main switch off clears a partially scheduled window', async () => {
  const state = setup();
  state.device.failAfterSchedules = 3;
  await assert.rejects(state.reconcileScheduledNotifications(input), /Device scheduling failed/);
  await state.reconcileScheduledNotifications({
    ...input,
    preferences: {
      ...input.preferences,
      dailyPlanReminders: { ...input.preferences.dailyPlanReminders, session: { enabled: false } },
    },
  });
  assert.equal(state.pending.size, 0);
  assert.deepEqual(state.saved(), {});
});

test('reverting a failed time edit restores the canceled reminder too', async () => {
  const state = setup();
  await state.reconcileScheduledNotifications(input);
  state.device.failAfterSchedules = 17;
  await assert.rejects(state.reconcileScheduledNotifications({
    ...input,
    dailyPlanSchedule: {
      ...input.dailyPlanSchedule,
      actions: { ...input.dailyPlanSchedule.actions, session: '22:15' },
    },
  }), /Device scheduling failed/);
  assert.equal(state.pending.size, 13);
  await state.reconcileScheduledNotifications(input);
  assert.equal(state.pending.size, 14);
  assert.ok([...state.pending.values()].every((entry) =>
    entry.date.getHours() === 8 && entry.date.getMinutes() === 15,
  ));
  assert.equal(Object.keys(state.saved()).length, 14);
});
