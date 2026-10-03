import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(file, require) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, { exports, require });
  return exports;
}

function setup() {
  const hooks = [];
  let cursor = 0;
  let reaction;
  let style;
  const animations = [];
  const stable = (initial) => {
    const index = cursor++;
    if (!(index in hooks)) hooks[index] = initial();
    return hooks[index];
  };
  const geometry = loadModule('./journeyReorder.ts');
  const { useJourneyRail } = loadModule('./useJourneyRail.ts', (name) => {
    if (name === 'react') return {
      useRef: (initial) => stable(() => ({ current: initial })),
      useMemo: (callback) => callback(),
    };
    if (name === 'react-native-reanimated') return {
      useSharedValue: (initial) => stable(() => ({ value: initial })),
      useAnimatedReaction: (prepare, react) => { reaction = () => react(prepare()); },
      useAnimatedStyle: (callback) => { style = callback; },
      withTiming: (value, timing) => { animations.push({ value, timing }); return value; },
    };
    if (name === './journeyReorder') return geometry;
    if (name === './useJourneyReorder') return { JOURNEY_DRAG_SETTLE: { duration: 200 } };
    throw new Error(`Unexpected module ${name}`);
  });
  const controller = {
    ids: ['a', 'b'],
    order: { value: { key: 'a|b', ids: ['a', 'b'] } },
    heights: { value: {} },
    dragging: { value: false },
    gap: 12,
    committedKey: 'a|b',
    measuredHeights: {},
  };
  const shape = ({ firstHeight, lastHeight, lastOffset, height }) => ({
    top: firstHeight / 2,
    bottom: (height - lastOffset - lastHeight - 12) / 2,
  });
  const done = { a: true, b: true };
  return {
    controller,
    done,
    animations,
    render(height) {
      cursor = 0;
      useJourneyRail({ controller, ids: controller.ids, height,
        timing: { duration: 420 }, shape, done });
      reaction();
      return { ...style() };
    },
    updateUI() { reaction(); return { ...style() }; },
  };
}

test('completed rail waits for both measurements and places its first endpoints without animation', () => {
  for (const containerFirst of [true, false]) {
    const harness = setup();
    assert.equal(harness.render(0).opacity, 0);
    if (containerFirst) {
      assert.equal(harness.render(260).opacity, 0);
    } else {
      harness.controller.measuredHeights = { a: 82, b: 82 };
      harness.controller.heights.value = { a: 82, b: 82 };
      assert.equal(harness.render(0).opacity, 0);
    }
    harness.controller.measuredHeights = { a: 82, b: 82 };
    harness.controller.heights.value = { a: 82, b: 82 };
    assert.deepEqual(harness.render(260), { opacity: 1, top: 41, bottom: 36 });
    assert.equal(harness.animations.length, 0);
  }
});

test('completion changes extend the rail and stale proposed orders use committed geometry', () => {
  const harness = setup();
  harness.controller.measuredHeights = { a: 82, b: 100 };
  harness.controller.heights.value = { a: 82, b: 100 };
  harness.done.b = false;
  assert.deepEqual(harness.render(278), { opacity: 1, top: 41, bottom: 92 });
  harness.done.b = true;
  assert.deepEqual(harness.render(278), { opacity: 1, top: 41, bottom: 36 });
  assert.equal(harness.animations.length, 2);
  harness.controller.order.value = { key: 'old', ids: ['missing'] };
  assert.deepEqual(harness.render(278), { opacity: 1, top: 41, bottom: 36 });
});

test('later UI-thread geometry changes animate and incomplete measurements retain placement', () => {
  const harness = setup();
  harness.controller.measuredHeights = { a: 82, b: 82 };
  harness.controller.heights.value = { a: 82, b: 82 };
  harness.render(260);
  harness.controller.heights.value = {};
  assert.deepEqual(harness.updateUI(), { opacity: 1, top: 41, bottom: 36 });
  assert.equal(harness.animations.length, 0);
  harness.controller.heights.value = { a: 100, b: 82 };
  assert.deepEqual(harness.updateUI(), { opacity: 1, top: 50, bottom: 27 });
  assert.equal(harness.animations.length, 2);
  assert.equal(harness.animations[0].timing.duration, 420);
});
