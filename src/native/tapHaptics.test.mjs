import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./tapHaptics.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function load({ enabled = true, reject = false } = {}) {
  const calls = [];
  const timers = [];
  const feedback = (kind, style) => {
    calls.push([kind, style]);
    return reject ? Promise.reject(new Error('native unavailable')) : Promise.resolve();
  };
  const haptics = {
    ImpactFeedbackStyle: { Soft: 'Soft', Light: 'Light', Medium: 'Medium', Heavy: 'Heavy', Rigid: 'Rigid' },
    NotificationFeedbackType: { Success: 'Success', Warning: 'Warning' },
    impactAsync: (style) => feedback('impact', style),
    notificationAsync: (style) => feedback('notification', style),
    selectionAsync: () => feedback('selection', undefined),
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'expo-haptics') return haptics;
      if (name === '../services/preferences/hapticsPreference') {
        return { isHapticsEnabled: () => enabled };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
    setTimeout(callback, delay) { timers.push({ callback, delay }); },
  });
  return { api: exports, calls, timers, setEnabled(value) { enabled = value; } };
}

test('completion actions each emit one impact with their own weight', () => {
  const { api, calls, timers } = load();
  api.triggerTodoCompleteHaptic();
  api.triggerActivityCompleteHaptic();
  api.triggerBreathingCompleteHaptic();
  assert.deepEqual(calls, [['impact', 'Soft'], ['impact', 'Medium'], ['impact', 'Soft']]);
  assert.equal(timers.length, 0);
});

test('miss is a gentle single impact and celebration is one heavy impact', () => {
  const { api, calls, timers } = load();
  api.triggerMissHaptic();
  api.triggerCelebrationHaptic();
  assert.deepEqual(calls, [['impact', 'Light'], ['impact', 'Heavy']]);
  assert.equal(timers.length, 0);
});

test('disabled preference prevents all feedback and delayed work', () => {
  const { api, calls, timers } = load({ enabled: false });
  for (const trigger of Object.values(api)) trigger();
  assert.deepEqual(calls, []);
  assert.deepEqual(timers, []);
});

test('existing selection, primary action and coin weights remain distinct', () => {
  const { api, calls } = load();
  api.triggerTapHaptic();
  api.triggerMediumHaptic();
  api.triggerCoinSettleHaptic();
  assert.deepEqual(calls, [['selection', undefined], ['impact', 'Medium'], ['impact', 'Rigid']]);
});

test('bounce keeps two beats and rechecks the live preference before its second beat', () => {
  const { api, calls, timers, setEnabled } = load();
  api.triggerBounceHaptic();
  assert.deepEqual(calls, [['impact', 'Light']]);
  assert.equal(timers[0].delay, 340);
  setEnabled(false);
  timers[0].callback();
  assert.deepEqual(calls, [['impact', 'Light']]);
  setEnabled(true);
  api.triggerBounceHaptic();
  timers[1].callback();
  assert.deepEqual(calls, [['impact', 'Light'], ['impact', 'Light'], ['impact', 'Soft']]);
});

test('rejected native feedback promises are swallowed', async () => {
  const { api, timers } = load({ reject: true });
  for (const trigger of Object.values(api)) assert.doesNotThrow(() => trigger());
  for (const timer of timers) assert.doesNotThrow(() => timer.callback());
  // An uncaught rejection would fail this node:test case on the next turn.
  await new Promise((resolve) => setImmediate(resolve));
});
