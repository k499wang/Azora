import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as journeyReorder from './journeyReorder.ts';

function setup() {
  const hooks = [];
  const frames = new Map();
  const effects = [];
  let cursor = 0;
  let frameId = 0;
  let writes = 0;
  let updates = 0;
  const stable = (initial) => {
    const index = cursor++;
    if (!(index in hooks)) hooks[index] = initial();
    return hooks[index];
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL('./useJourneyReorder.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, {
    exports,
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout,
    clearTimeout,
    require(name) {
      if (name === 'react') return {
        useRef: (initial) => stable(() => ({ current: initial })),
        useState(initial) {
          const state = stable(() => ({ value: initial }));
          return [state.value, (update) => {
            updates++;
            const next = typeof update === 'function' ? update(state.value) : update;
            if (next !== state.value) writes++;
            state.value = next;
          }];
        },
        useCallback: (callback) => callback,
        useMemo: (callback) => callback(),
        useEffect(callback, dependencies) {
          const state = stable(() => ({ dependencies: undefined, cleanup: undefined }));
          if (state.dependencies && dependencies.every((value, index) => Object.is(value, state.dependencies[index]))) return;
          state.cleanup?.();
          state.dependencies = dependencies;
          effects.push(() => { state.cleanup = callback(); });
        },
      };
      if (name === 'react-native-reanimated') return {
        useSharedValue: (initial) => stable(() => ({ value: initial })),
      };
      if (name.endsWith('/motion')) return { duration: { base: 200 }, easing: { settle: {} } };
      if (name === './journeyReorder') return {
        ...journeyReorder,
        journeyContentHeight: () => null,
        journeyRowsMeasured: (ids, heights) => ids.every((id) => heights[id] > 0),
      };
      throw new Error(`Unexpected module ${name}`);
    },
  });
  return {
    render(ids = ['a', 'b', 'c'], heights, options = {}) {
      cursor = 0;
      const result = exports.useJourneyReorder({ ids, heights, gap: 8, onReorder() {}, ...options });
      effects.splice(0).forEach((effect) => effect());
      return result.controller;
    },
    reorder(ids, options) {
      cursor = 0;
      const result = exports.useJourneyReorder({ ids, gap: 8, onReorder() {}, ...options });
      effects.splice(0).forEach((effect) => effect());
      return result;
    },
    flush() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(0));
    },
    unmount() { hooks.forEach((hook) => hook?.cleanup?.()); },
    get writes() { return writes; },
    get updates() { return updates; },
    frames,
  };
}

const layout = (height) => ({ nativeEvent: { layout: { height } } });

test('a burst of row measurements commits all heights in one animation frame', () => {
  const harness = setup();
  const controller = harness.render();
  controller.measure('a', layout(50));
  controller.measure('b', layout(60));
  controller.measure('c', layout(70));
  controller.measure('a', layout(55));
  assert.equal(harness.frames.size, 1);
  assert.equal(harness.writes, 0);
  harness.flush();
  assert.equal(harness.writes, 1);
  assert.equal(harness.updates, 1);
  const measured = harness.render();
  assert.deepEqual({ ...measured.measuredHeights }, { a: 55, b: 60, c: 70 });
  assert.equal(measured.enabled, true);
  assert.equal(measured.heights.value, measured.measuredHeights);
});

test('equal-height reports never publish another measured state', () => {
  const harness = setup();
  harness.render().measure('a', layout(50));
  harness.flush();
  const first = harness.render();
  for (let i = 0; i < 20; i++) first.measure('a', layout(50));
  harness.flush();
  const next = harness.render();
  assert.equal(harness.writes, 1);
  assert.equal(next.measuredHeights, first.measuredHeights);
});

test('removed rows cannot enter measured state through stale or queued events', () => {
  const harness = setup();
  const old = harness.render();
  old.measure('a', layout(50));
  harness.render(['b', 'c']);
  old.measure('a', layout(90));
  old.measure('missing', layout(90));
  harness.flush();
  assert.equal(harness.render(['b', 'c']).measuredHeights.a, undefined);
  assert.equal(harness.writes, 0);
  assert.equal(harness.frames.size, 0);
});

test('unmount cancels the pending layout flush', () => {
  const harness = setup();
  harness.render().measure('a', layout(50));
  assert.equal(harness.frames.size, 1);
  harness.unmount();
  assert.equal(harness.frames.size, 0);
  harness.flush();
  assert.equal(harness.writes, 0);
});

test('known row heights bypass measurement work entirely', () => {
  const harness = setup();
  const controller = harness.render(['a', 'b'], { a: 50, b: 60 });
  controller.measure('a', layout(90));
  assert.equal(harness.frames.size, 0);
  assert.equal(harness.writes, 0);
  assert.deepEqual({ ...controller.measuredHeights }, { a: 50, b: 60 });
});

test('a fixed last row cannot be moved, and nothing moves below it', () => {
  const orders = [];
  const { moveBy, controller } = setup().reorder(['a', 'b', 'tail'], {
    fixedTailId: 'tail',
    onReorder: (ids) => orders.push(ids),
  });
  assert.equal(controller.fixedTailId, 'tail');
  moveBy('tail', -1);
  moveBy('b', 1);
  assert.deepEqual(orders, []);
  moveBy('b', -1);
  assert.deepEqual(orders, [['b', 'a']]);
});

test('the order handed back never holds the fixed last row, so it is never saved', () => {
  const orders = [];
  const { controller } = setup().reorder(['a', 'b', 'tail'], {
    fixedTailId: 'tail',
    onReorder: (ids) => orders.push(ids),
  });
  controller.onDrop(['b', 'a', 'tail']);
  assert.deepEqual(orders, [['b', 'a']]);
});

test('a list without a fixed last row hands back every row', () => {
  const orders = [];
  const { moveBy, controller } = setup().reorder(['a', 'b', 'c'], {
    onReorder: (ids) => orders.push(ids),
  });
  assert.equal(controller.fixedTailId, null);
  moveBy('b', 1);
  controller.onDrop(['c', 'a', 'b']);
  assert.deepEqual(orders, [['a', 'c', 'b'], ['c', 'a', 'b']]);
});
