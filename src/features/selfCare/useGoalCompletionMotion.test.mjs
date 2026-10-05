import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(reducedMotion = false) {
  const hooks = [];
  const effects = [];
  const ui = [];
  const values = [];
  const timers = new Set();
  let cursor = 0;
  const exports = {};
  const react = {
    useRef(initial) {
      const index = cursor++;
      return hooks[index] ??= { current: initial };
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (next) => { hooks[index] = next; }];
    },
    useCallback(callback) { return callback; },
    useEffect(callback, deps) {
      const index = cursor++;
      if (hooks[index]?.deps.every((value, i) => value === deps[i])) return;
      hooks[index]?.cleanup?.();
      hooks[index] = { deps };
      effects.push(() => { hooks[index].cleanup = callback(); });
    },
  };
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL('./useGoalCompletionMotion.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native-reanimated') return {
        useReducedMotion: () => reducedMotion,
        useSharedValue(initial) {
          const index = cursor++;
          if (!(index in hooks)) {
            hooks[index] = { value: initial };
            values.push(hooks[index]);
          }
          return hooks[index];
        },
        runOnUI: (callback) => (...args) => ui.push(() => callback(...args)),
        useAnimatedStyle: () => ({}),
        cancelAnimation() {},
        withTiming: (to, config) => ({ to, config }),
        withDelay: (delay, animation) => ({ delay, animation }),
        withSequence: (...sequence) => ({ sequence }),
        withSpring: (to) => ({ to }),
      };
      if (name.endsWith('/colors')) return { colors: {} };
      if (name.endsWith('/motion')) return {
        duration: { fast: 100, base: 200, slow: 300, fill: 900 },
        easing: {},
      };
      if (name.endsWith('/uiThreadTimer')) return {
        startUiTimer(ms, callback) {
          const timer = { ms, callback };
          timers.add(timer);
          return () => timers.delete(timer);
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    render(done = false) {
      cursor = 0;
      const motion = exports.useGoalCompletionMotion(done);
      effects.splice(0).forEach((effect) => effect());
      return motion;
    },
    flushUi() { ui.splice(0).forEach((callback) => callback()); },
    ui, values, timers,
  };
}

test('a tick schedules one UI operation and optimistic rendering preserves its sequence', () => {
  const harness = setup();
  harness.render().play(true);
  assert.equal(harness.ui.length, 1);
  assert.equal(harness.values[0].value, 0);
  harness.flushUi();
  const fill = harness.values[0].value;
  assert.equal(fill.animation.to, 1);
  assert.equal(harness.render(true).locked, true);
  assert.equal(harness.values[0].value, fill);
  assert.equal(harness.timers.size, 1);
});

test('undo batches the reverse sequence and rollback restores static completion state', () => {
  const harness = setup();
  harness.render(true).play(false);
  harness.flushUi();
  assert.equal(harness.values[0].value.to, 0);
  harness.render(false);
  harness.render(true);
  assert.equal(harness.values[0].value, 1);
  assert.equal(harness.values[1].value, 1);
  assert.equal(harness.values[2].value, 1);
});

test('reduced motion updates the marks in one UI operation without locking', () => {
  const harness = setup(true);
  harness.render().play(true);
  assert.equal(harness.ui.length, 1);
  assert.equal(harness.timers.size, 0);
  harness.flushUi();
  assert.equal(harness.values[0].value, 1);
  assert.equal(harness.values[1].value, 1);
  assert.equal(harness.values[2].value, 1);
  assert.equal(harness.render(true).locked, false);
});
