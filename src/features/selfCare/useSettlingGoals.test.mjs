import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const hooks = [];
  const timers = new Map();
  const cleanups = [];
  const visibility = [];
  let cursor = 0;
  let now = 0;
  let timerId = 0;
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL('./useSettlingGoals.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, {
    exports,
    setTimeout(callback, delay) {
      timers.set(++timerId, { callback, at: now + delay });
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); },
    require(name) {
      if (name.endsWith('useWhileVisible')) return {
        useWhileVisible(callback) {
          const index = cursor++;
          if (!(index in hooks)) {
            hooks[index] = true;
            const owner = { start: callback, stop: callback() };
            visibility.push(owner);
            cleanups.push(() => owner.stop());
          }
        },
      };
      return {
        useState(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = initial;
          return [hooks[index], (next) => { hooks[index] = next(hooks[index]); }];
        },
        useRef(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = { current: initial };
          return hooks[index];
        },
        useCallback: (callback) => callback,
        useMemo: (callback) => callback(),
        useEffect(callback) {
          const index = cursor++;
          if (!(index in hooks)) {
            hooks[index] = true;
            cleanups.push(callback());
          }
        },
      };
    },
  });
  return {
    render() { cursor = 0; return exports.useSettlingGoals({ holdMs: 100, leaveMs: 50 }); },
    advance(ms) {
      const target = now + ms;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= target)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = target;
    },
    unmount() { cleanups.forEach((cleanup) => cleanup?.()); },
    blur() { visibility.forEach((owner) => owner.stop()); },
    focus() { visibility.forEach((owner) => { owner.stop = owner.start(); }); },
    timers,
  };
}

test('rapid ticks hold every row until the final tick settles', () => {
  const harness = setup();
  harness.render().hold('a');
  harness.advance(80);
  harness.render().hold('b');
  harness.advance(80);
  assert.deepEqual([...harness.render().holding], ['a', 'b']);
  harness.advance(20);
  assert.equal(harness.render().holding.size, 0);
  assert.equal(harness.render().settling.size, 2);
  harness.advance(50);
  assert.equal(harness.render().settling.size, 0);
});

test('a tick during filing never brings the fading row back, only delays its gap', () => {
  const harness = setup();
  harness.render().hold('a');
  harness.advance(120);
  harness.render().hold('b');
  harness.advance(30);
  // `a` keeps leaving, out of sight, and its slot stays open past the moment
  // it would have closed — the list holds still while `b` is held.
  assert.deepEqual([...harness.render().holding], ['b']);
  assert.deepEqual([...harness.render().settling].sort(), ['a', 'b']);
  harness.advance(70);
  assert.equal(harness.render().holding.size, 0);
  assert.equal(harness.render().settling.size, 2);
  harness.advance(50);
  assert.equal(harness.render().settling.size, 0);
});

test('undo releases only its row and unmount clears outstanding work', () => {
  const harness = setup();
  harness.render().hold('a');
  harness.render().hold('b');
  harness.render().release('a');
  assert.deepEqual([...harness.render().settling], ['b']);
  harness.advance(100);
  harness.unmount();
  assert.equal(harness.timers.size, 0);
});

test('ten rapid completion cycles keep timer work bounded and fully settle', () => {
  const harness = setup();
  for (let cycle = 0; cycle < 10; cycle++) {
    for (let row = 0; row < 30; row++) {
      harness.render().hold(`goal-${row}`);
      harness.advance(3);
      assert.equal(harness.timers.size, 1);
    }
    assert.equal(harness.render().settling.size, 30);
    harness.advance(110);
    assert.equal(harness.timers.size, 1);
    assert.equal(harness.render().holding.size, 0);
    // Interrupt filing without making the departing group reappear.
    harness.render().hold('late');
    assert.equal(harness.timers.size, 1);
    assert.deepEqual([...harness.render().holding], ['late']);
    harness.advance(150);
    assert.equal(harness.timers.size, 0);
    assert.equal(harness.render().settling.size, 0);
  }
});

test('ten blur and reentry cycles discard old phases and timers during either phase', () => {
  const harness = setup();
  for (let cycle = 0; cycle < 10; cycle++) {
    harness.render().hold('a');
    harness.render().hold('b');
    if (cycle % 2) harness.advance(120);
    harness.blur();
    assert.equal(harness.timers.size, 0);
    assert.equal(harness.render().settling.size, 0);
    harness.advance(1000);
    harness.focus();
    harness.render().hold('fresh');
    assert.deepEqual([...harness.render().holding], ['fresh']);
    harness.advance(150);
    assert.equal(harness.timers.size, 0);
    assert.equal(harness.render().settling.size, 0);
  }
});
