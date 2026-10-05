import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const hooks = [];
  const timers = new Map();
  let cursor = 0;
  let now = 0;
  let timerId = 0;
  let visibilityCleanup;
  let visibilityStart;
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL('./useCleanupStepFinish.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, {
    exports,
    require(name) {
      if (name === 'react') return {
        useRef(initial) { return hooks[cursor++] ??= { current: initial }; },
        useState(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = initial;
          return [hooks[index], (value) => { hooks[index] = value; }];
        },
        useCallback(callback) { return callback; },
      };
      if (name.endsWith('/useWhileVisible')) return {
        useWhileVisible(start, deps) {
          const index = cursor++;
          if (hooks[index]?.[0] === deps[0]) return;
          visibilityCleanup?.();
          hooks[index] = deps;
          visibilityStart = start;
          visibilityCleanup = start();
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, deadline: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  });
  return {
    render(onFinished, active = true) {
      cursor = 0;
      return exports.useCleanupStepFinish({ active, onFinished });
    },
    advance(ms) {
      const target = now + ms;
      while (true) {
        const next = [...timers.entries()].sort((a, b) => a[1].deadline - b[1].deadline)[0];
        if (!next || next[1].deadline > target) break;
        now = next[1].deadline;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = target;
    },
    hide() { visibilityCleanup?.(); },
    show() { visibilityCleanup = visibilityStart(); },
    timers,
  };
}

test('holds the checked instruction before fading and finishes exactly once despite duplicate taps', () => {
  const harness = setup();
  let completions = 0;
  const complete = () => { completions++; };
  const step = harness.render(complete);
  step.finish();
  step.finish();
  assert.equal(harness.render(complete).phase, 'holding');
  assert.equal(harness.timers.size, 1);
  harness.advance(349);
  assert.equal(completions, 0);
  assert.equal(harness.render(complete).phase, 'holding');
  harness.advance(1);
  assert.equal(harness.render(complete).phase, 'fading');
  harness.render(complete).finish();
  harness.advance(179);
  assert.equal(completions, 0);
  harness.advance(1);
  assert.equal(completions, 1);
  assert.equal(harness.render(complete).phase, 'idle');
  assert.equal(harness.timers.size, 0);
});

for (const delay of [100, 400]) {
  test(`leaving during ${delay < 350 ? 'holding' : 'fading'} cancels completion across repeated visits`, () => {
    const harness = setup();
    let completions = 0;
    const complete = () => { completions++; };
    for (let cycle = 0; cycle < 10; cycle++) {
      harness.render(complete).finish();
      harness.advance(delay);
      harness.hide();
      assert.equal(harness.timers.size, 0);
      assert.equal(harness.render(complete).phase, 'idle');
      harness.render(complete).finish();
      harness.advance(1000);
      assert.equal(completions, 0);
      harness.show();
    }
    harness.render(complete).finish();
    harness.advance(530);
    assert.equal(completions, 1);
  });
}

test('uses the current completion callback and does not finish while inactive', () => {
  const harness = setup();
  let oldCalls = 0;
  let newCalls = 0;
  harness.render(() => { oldCalls++; }).finish();
  harness.render(() => { newCalls++; });
  harness.advance(530);
  assert.equal(oldCalls, 0);
  assert.equal(newCalls, 1);
  harness.render(() => { newCalls++; }).finish();
  harness.render(() => { newCalls++; }, false);
  harness.advance(530);
  harness.render(() => { newCalls++; }, false).finish();
  harness.advance(530);
  assert.equal(newCalls, 1);
  assert.equal(harness.timers.size, 0);
});
