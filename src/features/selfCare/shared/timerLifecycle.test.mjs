import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { createSerializedAsync } from '../../../lib/serializedAsync.ts';
import { buildTaskTimerContent } from '../../../services/notifications/notificationCatalog.ts';

function load(file, modules) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require(name) {
    const key = Object.keys(modules).find((key) => name.endsWith(key));
    if (!key) throw new Error(name);
    return modules[key];
  } });
  return exports;
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('late wake-lock activation cannot release a newly visible timer’s wake lock', async () => {
  let start;
  const pending = [];
  const deactivated = [];
  const hook = load('./useTimerKeepAwake.ts', {
    react: { useRef: (value) => ({ current: value }) },
    'useWhileVisible': { useWhileVisible(callback) { start = callback; } },
    'expo-keep-awake': {
      activateKeepAwakeAsync(tag) { return new Promise((resolve) => pending.push({ tag, resolve })); },
      deactivateKeepAwake(tag) { deactivated.push(tag); },
    },
  });
  hook.useTimerKeepAwake('focus');
  const firstStop = start();
  firstStop();
  // A fresh hook instance can mount before the old native activation resolves.
  hook.useTimerKeepAwake('focus');
  const secondStop = start();
  assert.notEqual(pending[0].tag, pending[1].tag);
  pending[0].resolve();
  await flush();
  assert.ok(deactivated.includes(pending[0].tag));
  assert.ok(!deactivated.includes(pending[1].tag));
  pending[1].resolve();
  await flush();
  secondStop();
  assert.ok(deactivated.includes(pending[1].tag));
});

test('cancel queues behind a slow schedule so a timer cannot leave an orphan alert', async () => {
  const calls = [];
  let finishSchedule;
  const helper = load('./taskTimerNotification.ts', {
    serializedAsync: { createSerializedAsync },
    notificationCatalog: { buildTaskTimerContent },
    notificationClient: {
      scheduleDateNotification(input) {
        calls.push({ action: 'schedule', input });
        return new Promise((resolve) => { finishSchedule = resolve; });
      },
      async cancelScheduledNotification(id) { calls.push({ action: 'cancel', id }); },
    },
  });
  helper.scheduleTaskTimerAlert({ kind: 'focus', title: 'Focus Timer', nextTitle: null, at: new Date(60_000) });
  helper.cancelTaskTimerAlert('focus');
  await flush();
  assert.equal(calls.length, 1);
  finishSchedule('scheduled');
  await flush();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].input.identifier, calls[1].id);
  assert.equal(calls[0].input.data.notification_kind, 'focus_timer');
  assert.equal(calls[0].input.data.destination, undefined);
});

test('routine and focus alerts use independent identifiers and accurate copy', async () => {
  const alerts = [];
  const helper = load('./taskTimerNotification.ts', {
    serializedAsync: { createSerializedAsync },
    notificationCatalog: { buildTaskTimerContent },
    notificationClient: {
      async scheduleDateNotification(input) { alerts.push(input); return input.identifier; },
      async cancelScheduledNotification() {},
    },
  });
  helper.scheduleTaskTimerAlert({ kind: 'focus', title: 'Focus Timer', nextTitle: null, at: new Date(60_000) });
  helper.scheduleTaskTimerAlert({ kind: 'routine', title: 'Read', nextTitle: 'Sleep', at: new Date(60_000) });
  await flush();
  assert.equal(alerts.length, 2);
  assert.notEqual(alerts[0].identifier, alerts[1].identifier);
  assert.match(alerts[0].body, /focus session is complete/);
  assert.equal(alerts[1].body, 'Next up: Sleep');
});
