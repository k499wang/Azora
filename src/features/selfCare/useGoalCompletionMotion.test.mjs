import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as selfCareGoal from './domain/selfCareGoal.ts';

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
        useAnimatedStyle: (callback) => callback,
        cancelAnimation() {},
        withTiming: (to, config) => ({ to, config, valueOf: () => to }),
        withDelay: (delay, animation) => ({ delay, animation }),
        withSequence: (...sequence) => ({ sequence }),
        withSpring: (to) => ({ to }),
      };
      if (name.endsWith('/colors')) return { colors: {} };
      if (name.endsWith('/motion')) return {
        duration: { fast: 100, base: 200, slow: 300, fill: 900 },
        easing: {},
        spring: { bounce: {} },
      };
      if (name.endsWith('/uiThreadTimer')) return {
        startUiTimer(ms, callback) {
          const timer = { ms, callback };
          timers.add(timer);
          return () => timers.delete(timer);
        },
      };
      if (name === './domain/selfCareGoal') return selfCareGoal;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    render(done = false, filing = false, flushEffects = true) {
      cursor = 0;
      const motion = exports.useGoalCompletionMotion(done, filing);
      if (flushEffects) effects.splice(0).forEach((effect) => effect());
      return motion;
    },
    flushUi() { ui.splice(0).forEach((callback) => callback()); },
    unmount() { hooks.forEach((hook) => hook?.cleanup?.()); },
    ui, values, timers,
  };
}

test('a tick schedules one UI operation and optimistic rendering preserves its sequence', () => {
  const harness = setup();
  harness.render().play(true);
  assert.equal(harness.ui.length, 1);
  assert.equal(harness.values[0].value, 0);
  harness.flushUi();
  assert.equal(harness.values[0].value, 1);
  const strike = harness.values[1].value;
  assert.equal(strike.animation.to, 1);
  assert.equal(harness.render(true).locked, true);
  assert.equal(harness.values[1].value, strike);
  assert.equal(harness.timers.size, 1);
});

test('undo batches the reverse sequence and rollback restores static completion state', () => {
  const harness = setup();
  harness.render(true).play(false);
  harness.flushUi();
  assert.equal(harness.values[0].value, 0);
  assert.equal(harness.values[1].value.to, 0);
  harness.render(false);
  harness.render(true);
  assert.equal(harness.values[0].value, 1);
  assert.equal(harness.values[1].value, 1);
});

test('reduced motion updates the marks in one UI operation without locking', () => {
  const harness = setup(true);
  harness.render().play(true);
  assert.equal(harness.ui.length, 1);
  assert.equal(harness.timers.size, 0);
  harness.flushUi();
  assert.equal(harness.values[0].value, 1);
  assert.equal(harness.values[1].value, 1);
  assert.equal(harness.render(true).locked, false);
});

test('a shown card is visible before mount effects run and while its arrival is unfinished', () => {
  const harness = setup();
  const beforeEffects = harness.render(false, false, false);
  assert.equal(beforeEffects.cardStyle().opacity, 1);
  assert.equal(beforeEffects.cardStyle().transform[0].scale, 0.96);
  assert.equal(beforeEffects.locked, false);

  const arriving = harness.render();
  assert.equal(arriving.cardStyle().opacity, 1);
  assert.equal(harness.values[4].value.to, 1);
  assert.equal(harness.timers.size, 0);

  harness.unmount();
  harness.values[4].value = 0.96;
  assert.equal(arriving.cardStyle().opacity, 1);
});

test('filing always targets zero opacity, including a card mounted or remounted while leaving', () => {
  for (let mount = 0; mount < 2; mount++) {
    const harness = setup();
    const leaving = harness.render(true, true, false);
    assert.equal(leaving.cardStyle().opacity.to, 0);
    assert.equal(leaving.cardStyle().opacity.config.duration, 100);
    harness.unmount();
  }
});

test('cancelling a removal or rolling completion back restores opacity immediately', () => {
  const harness = setup();
  assert.equal(harness.render(true, true).cardStyle().opacity.to, 0);

  // An interrupted decoration cannot retain control of a shown card's opacity.
  harness.values[4].value = 0.96;
  const restored = harness.render(false, false);
  assert.equal(restored.cardStyle().opacity, 1);
  assert.equal(harness.render(true, false).cardStyle().opacity, 1);
  assert.equal(harness.render(false, false, false).cardStyle().opacity, 1);
});

test('reduced motion changes filing opacity immediately and never scales an arrival', () => {
  const harness = setup(true);
  assert.equal(harness.render(true, true).cardStyle().opacity, 0);
  const restored = harness.render(false, false);
  assert.equal(restored.cardStyle().opacity, 1);
  assert.equal(restored.cardStyle().transform[0].scale, 1);
});
