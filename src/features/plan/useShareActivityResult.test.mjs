import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useShareActivityResult.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup() {
  const hooks = [];
  const requests = [];
  const alerts = [];
  let cursor = 0;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return {
        useRef(initial) { return hooks[cursor++] ??= { current: initial }; },
        useCallback(callback, dependencies) {
          const index = cursor++;
          const previous = hooks[index];
          if (previous && dependencies.every((value, i) => Object.is(value, previous.dependencies[i]))) {
            return previous.callback;
          }
          hooks[index] = { callback, dependencies };
          return callback;
        },
      };
      if (name === 'react-native') return {
        Share: {
          share({ message }) {
            return new Promise((resolve, reject) => requests.push({ message, resolve, reject }));
          },
        },
        Alert: { alert: (...args) => alerts.push(args) },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    render(message = 'My small win') {
      cursor = 0;
      return exports.useShareActivityResult(message);
    },
    requests,
    alerts,
  };
}

test('suppresses repeated taps while a share sheet is pending, including after rerender', async () => {
  const harness = setup();
  const share = harness.render();
  const pending = share();
  await share();
  await harness.render()();
  assert.equal(harness.requests.length, 1);
  assert.equal(harness.requests[0].message, 'My small win');
  harness.requests[0].resolve({ action: 'sharedAction' });
  await pending;
});

for (const action of ['sharedAction', 'dismissedAction']) {
  test(`${action} releases the guard for another share`, async () => {
    const harness = setup();
    const share = harness.render();
    const first = share();
    harness.requests[0].resolve({ action });
    await first;
    const second = share();
    assert.equal(harness.requests.length, 2);
    harness.requests[1].resolve({ action: 'sharedAction' });
    await second;
    assert.deepEqual(harness.alerts, []);
  });
}

test('a failed share shows an alert and allows retry', async () => {
  const harness = setup();
  const share = harness.render();
  const failed = share();
  harness.requests[0].reject(new Error('Native share unavailable'));
  await failed;
  assert.deepEqual(harness.alerts, [['Could not share', 'Please try again.']]);
  const retry = share();
  assert.equal(harness.requests.length, 2);
  harness.requests[1].resolve({ action: 'sharedAction' });
  await retry;
});

test('a new message after rerender is used without reopening a pending share', async () => {
  const harness = setup();
  const first = harness.render('Lesson small win')();
  const shareUpdated = harness.render('Reset small win');
  await shareUpdated();
  assert.equal(harness.requests.length, 1);
  harness.requests[0].resolve({ action: 'dismissedAction' });
  await first;
  const next = shareUpdated();
  assert.equal(harness.requests[1].message, 'Reset small win');
  harness.requests[1].resolve({ action: 'sharedAction' });
  await next;
});
