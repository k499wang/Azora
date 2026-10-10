import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path, suffix = '') {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8') + suffix, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

function setup() {
  const runner = {};
  vm.runInNewContext(compile('../../lib/ui/runWhileVisible.ts'), { exports: runner });
  const slots = [];
  const listeners = new Set();
  const work = new Map();
  let cursor = 0;
  let focused = true;
  let foreground = true;
  let reducedMotion = false;
  let pending = [];
  let taps = 0;
  let tree;
  const jsx = (type, props) => ({ type, props });
  const animation = (kind, fields) => ({ animation: true, kind, ...fields });
  const reanimated = {
    default: { View: 'Animated.View' },
    useReducedMotion: () => reducedMotion,
    useSharedValue(initial) {
      const index = cursor++;
      if (!slots[index]) {
        let value = initial;
        slots[index] = {
          get value() { return value; },
          set value(next) {
            value = next;
            work.delete(slots[index]);
            if (next?.animation) work.set(slots[index], next);
          },
        };
      }
      return slots[index];
    },
    cancelAnimation: (value) => work.delete(value),
    useAnimatedStyle: (factory) => factory,
    withTiming: (value, options) => animation('timing', { value, options }),
    withSequence: (...steps) => animation('sequence', { steps }),
    withDelay: (delay, step) => animation('delay', { delay, step }),
    withRepeat: (step, count) => animation('repeat', { step, count }),
  };
  const hue = { soft: 'soft', tintDeep: 'deep', ink: 'ink' };
  const dependencies = {
    Text: 'Text',
    colors: { playful: { amber: hue, violet: hue, blush: hue, sky: hue, stone: hue }, success: {}, text: {} },
    spacing: { sm: 8, md: 12 },
    typography: { label: { small: {} } },
    fonts: { bold: 'bold' },
    card: { taskKey: { width: 42, height: 38 } },
    radius: { full: 999 },
    taskCard: {},
    pressable: {},
    duration: { fast: 180 },
    easing: { enter: 'enter', gravity: 'gravity' },
    emphasis: { choose: 1.04 },
    triggerTapHaptic: () => { taps++; },
    journeyReorderActions: () => ({}),
    useWhileVisible(start, dependencies) {
      const index = cursor++;
      if (!slots[index] || dependencies.some((value, i) => !Object.is(value, slots[index].dependencies[i]))) {
        pending.push({ index, start, dependencies });
      }
    },
  };
  const exports = {};
  vm.runInNewContext(compile('./TodaysDailiesSection.tsx', '\nexport { ClaimButton };'), {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return { Pressable: 'Pressable', View: 'View', StyleSheet: { create: (styles) => styles } };
      if (name === 'react-native-reanimated') return reanimated;
      return dependencies;
    },
  });
  const flush = () => {
    for (const { index, start, dependencies } of pending) {
      slots[index]?.cleanup?.();
      slots[index] = {
        dependencies,
        cleanup: runner.runWhileVisible(start, {
          isVisible: () => focused && foreground,
          subscribe(onChange) { listeners.add(onChange); return () => listeners.delete(onChange); },
        }),
      };
    }
    pending = [];
  };
  return {
    render({ reduced = false, isArranging = () => false, onPress = () => {} } = {}) {
      cursor = 0;
      reducedMotion = reduced;
      tree = exports.ClaimButton({ title: 'Finish a habit', isArranging, onPress });
      flush();
      return tree;
    },
    renderOrdinaryRow() {
      cursor = 0;
      exports.DailyTaskRow({ title: 'Lesson', completed: false, locked: false, style: {}, glyph: 'stack', isArranging: () => false, onPress() {} });
      flush();
    },
    focus(value) { focused = value; for (const notify of listeners) notify(); },
    foreground(value) { foreground = value; for (const notify of listeners) notify(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
    loopCount: () => work.size,
    listenerCount: () => listeners.size,
    hopValue: () => slots[0]?.value,
    loop: () => [...work.values()][0],
    press: () => tree.props.children.props.onPress(),
    taps: () => taps,
  };
}

test('claim hops own one loop across ten focus/background cycles and stop for reduced motion and unmount', () => {
  const harness = setup();
  harness.focus(false);
  harness.render();
  assert.equal(harness.loopCount(), 0);
  harness.focus(true);
  assert.equal(harness.loop().kind, 'repeat');
  assert.equal(harness.loop().count, -1);
  assert.deepEqual(Array.from(harness.loop().step.steps.slice(0, 4), (step) => step.value), [1, 0, 0.5, 0]);
  assert.equal(harness.loop().step.steps[4].delay, 1300);
  for (let cycle = 0; cycle < 10; cycle++) {
    assert.equal(harness.loopCount(), 1);
    harness.focus(false);
    assert.equal(harness.loopCount(), 0);
    assert.equal(harness.hopValue(), 0);
    harness.focus(true);
    harness.foreground(false);
    assert.equal(harness.loopCount(), 0);
    assert.equal(harness.hopValue(), 0);
    harness.foreground(true);
    harness.render();
    assert.equal(harness.loopCount(), 1);
    assert.equal(harness.listenerCount(), 1);
  }
  harness.render({ reduced: true });
  assert.equal(harness.loopCount(), 0);
  assert.equal(harness.hopValue(), 0);
  harness.render();
  assert.equal(harness.loopCount(), 1);
  harness.unmount();
  assert.equal(harness.loopCount(), 0);
  assert.equal(harness.hopValue(), 0);
  assert.equal(harness.listenerCount(), 0);
});

test('claim pill preserves accessible copy and its arranging guard', () => {
  const harness = setup();
  let arranging = true;
  let claims = 0;
  const tree = harness.render({ isArranging: () => arranging, onPress: () => { claims++; } });
  const button = tree.props.children;
  assert.equal(button.props.accessibilityRole, 'button');
  assert.equal(button.props.accessibilityLabel, 'Claim Finish a habit');
  assert.equal(button.props.children.props.children, 'Claim');
  harness.press();
  assert.equal(claims, 0);
  assert.equal(harness.taps(), 0);
  arranging = false;
  harness.press();
  assert.equal(claims, 1);
  assert.equal(harness.taps(), 1);
  harness.unmount();
});

test('ordinary daily rows mount no claim animation or visibility subscription', () => {
  const harness = setup();
  harness.renderOrdinaryRow();
  assert.equal(harness.loopCount(), 0);
  assert.equal(harness.listenerCount(), 0);
  assert.equal(harness.hopValue(), undefined);
});
