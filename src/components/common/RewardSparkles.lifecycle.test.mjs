import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

function setup() {
  const runner = {};
  vm.runInNewContext(compile('../../lib/ui/runWhileVisible.ts'), { exports: runner });
  const slots = [];
  const subscriptions = new Set();
  const animationWork = new Map();
  let cursor = 0;
  let focused = true;
  let foreground = true;
  let pending = [];
  const reanimated = {
    useSharedValue(initial) {
      const index = cursor++;
      if (!slots[index]) {
        let value = initial;
        slots[index] = {
          get value() { return value; },
          set value(next) {
            value = next;
            animationWork.delete(slots[index]);
            if (next?.animation) animationWork.set(slots[index], next);
          },
        };
      }
      return slots[index];
    },
    cancelAnimation: (value) => animationWork.delete(value),
    useAnimatedStyle: (factory) => factory,
    withSpring: () => ({ animation: true }),
    withTiming: () => ({ animation: true }),
    withRepeat: (animation) => ({ ...animation, repeats: true }),
    withDelay: (_delay, animation) => animation,
  };
  const exports = {};
  vm.runInNewContext(compile('./RewardSparkles.tsx'), {
    exports,
    require(name) {
      if (name === 'react') return {};
      if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      if (name === 'react-native') return { StyleSheet: { create: (styles) => styles } };
      if (name === 'react-native-reanimated') return reanimated;
      if (name === './icons/Icon') return {};
      if (name === '../../theme/motion') return { duration: { slower: 500 }, easing: { breathe: 'breathe' }, spring: { bounce: 'bounce' } };
      if (name === '../../hooks/useWhileVisible') return {
        useWhileVisible(start, dependencies) {
          const index = cursor++;
          if (!slots[index] || dependencies.some((value, i) => !Object.is(value, slots[index].dependencies[i]))) {
            pending.push({ index, start, dependencies });
          }
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    render(active = true, reducedMotion = false) {
      cursor = 0;
      exports.LoopingTwinkle({ x: 0, y: 0, size: 16, color: 'gold', delay: 500, period: 1500, active, reducedMotion });
      for (const { index, start, dependencies } of pending) {
        slots[index]?.cleanup?.();
        slots[index] = {
          dependencies,
          cleanup: runner.runWhileVisible(start, {
            isVisible: () => focused && foreground,
            subscribe(onChange) {
              subscriptions.add(onChange);
              return () => subscriptions.delete(onChange);
            },
          }),
        };
      }
      pending = [];
    },
    focus(value) {
      focused = value;
      for (const notify of subscriptions) notify();
    },
    foreground(value) {
      foreground = value;
      for (const notify of subscriptions) notify();
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
    scheduledCount: () => animationWork.size,
    repeatingCount: () => [...animationWork.values()].filter((animation) => animation.repeats).length,
    listenerCount: () => subscriptions.size,
    popValue: () => slots[0].value,
  };
}

test('twinkles cancel delayed and repeating work across ten visibility cycles, inactive, reduced motion and unmount', () => {
  const harness = setup();
  harness.focus(false);
  harness.render();
  assert.equal(harness.scheduledCount(), 0);
  harness.focus(true);
  for (let cycle = 0; cycle < 10; cycle++) {
    assert.equal(harness.scheduledCount(), 2);
    assert.equal(harness.repeatingCount(), 1);
    harness.focus(false);
    assert.equal(harness.scheduledCount(), 0);
    harness.focus(true);
    harness.foreground(false);
    assert.equal(harness.scheduledCount(), 0);
    harness.foreground(true);
    harness.render();
    assert.equal(harness.listenerCount(), 1);
  }
  harness.render(false);
  assert.equal(harness.scheduledCount(), 0);
  assert.equal(harness.popValue(), 0);
  harness.render(true, true);
  assert.equal(harness.scheduledCount(), 0);
  assert.equal(harness.popValue(), 1);
  harness.render();
  assert.equal(harness.repeatingCount(), 1);
  harness.unmount();
  assert.equal(harness.scheduledCount(), 0);
  assert.equal(harness.listenerCount(), 0);
});
