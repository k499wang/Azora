import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('./useTodayJump.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup() {
  const slots = [], effects = [], js = [], frames = new Map(), scrolls = [];
  let cursor = 0, dirty = false, result, reaction, previous, frameId = 0;
  let options = { nodeKey: 'first:today', visibleTop: 100, visibleBottom: 650,
    scrollY: { value: 0 }, scrollRef: { current: { scrollTo: (value) => scrolls.push(value) } } };
  const slot = (make) => { const index = cursor++; return slots[index] ??= make(); };
  const same = (a, b) => a?.length === b?.length && a.every((value, index) => Object.is(value, b[index]));
  const memo = (callback, deps) => {
    const state = slot(() => ({}));
    if (!same(state.deps, deps)) { state.deps = deps; state.value = callback(); }
    return state.value;
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports, requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    require(name) {
      if (name === 'react') return {
        useRef: (current) => slot(() => ({ current })),
        useState(initial) {
          const state = slot(() => ({ value: initial }));
          return [state.value, (next) => { state.value = typeof next === 'function' ? next(state.value) : next; dirty = true; }];
        },
        useCallback: (callback, deps) => memo(() => callback, deps),
        useEffect(callback, deps) {
          const state = slot(() => ({}));
          if (!same(state.deps, deps)) {
            state.deps = deps;
            effects.push(() => { state.cleanup?.(); state.cleanup = callback(); });
          }
        },
      };
      if (name === 'react-native-reanimated') return {
        useSharedValue: (value) => slot(() => ({ value })),
        useAnimatedReaction: (read, callback) => { reaction = () => { const next = read(); callback(next, previous); previous = next; }; },
        runOnJS: (callback) => (...args) => js.push(() => callback(...args)),
      };
      return {};
    },
  });
  const render = (next = {}) => {
    options = { ...options, ...next };
    do { dirty = false; cursor = 0; result = exports.useTodayJump(options); while (effects.length) effects.shift()(); } while (dirty);
    return result;
  };
  render();
  return {
    get result() { return result; }, options, scrolls, render,
    reactUI() { reaction(); },
    flushJS() { while (js.length) js.shift()(); render(); },
    frame() { const current = [...frames.values()]; frames.clear(); current.forEach((callback) => callback()); render(); },
    get frames() { return frames.size; },
    unmount() { slots.forEach((state) => state.cleanup?.()); },
  };
}
const nativeNode = () => {
  const callbacks = [];
  return { callbacks, measureInWindow(callback) { callbacks.push(callback); },
    measured(y, width = 80, height = 80) { callbacks.shift()(0, y, width, height); } };
};

for (const [y, expected] of [[-100, 'up'], [300, 'on-screen'], [900, 'down']]) {
  test(`initial measurement waits for real ${expected} placement without flashing Start`, () => {
    const h = setup(), node = nativeNode();
    assert.equal(h.result.placement, 'pending');
    h.result.todayRef(node);
    h.render();
    node.measured(y);
    h.reactUI();
    assert.equal(h.result.placement, 'pending', 'queued UI classification cannot be mistaken for on-screen');
    h.flushJS();
    assert.equal(h.result.placement, expected);
    h.unmount();
    assert.equal(h.frames, 0);
  });
}

test('zero or missing native measurements retry for only two frames, then recover on layout', () => {
  const h = setup(), node = nativeNode();
  h.result.todayRef(node);
  node.measured(300, 0, 0);
  for (let count = 0; count < 5; count++) h.frame();
  assert.equal(node.callbacks.length, 2);
  assert.equal(h.frames, 0);
  assert.equal(h.result.placement, 'pending');
  h.result.remeasure();
  node.callbacks.at(-1)(0, 300, 80, 80);
  h.reactUI(); h.flushJS();
  assert.equal(h.result.placement, 'on-screen');
  h.unmount();
});

test('detached, replaced, out-of-order measurements and queued UI work cannot restore an old placement', () => {
  const h = setup(), first = nativeNode(), next = nativeNode();
  h.result.todayRef(first);
  first.measured(300);
  h.reactUI(); // Deliberately leave the old on-screen result queued.
  h.result.todayRef(null);
  h.result.todayRef(next);
  h.flushJS();
  assert.equal(h.result.placement, 'pending');
  h.result.remeasure();
  next.callbacks.at(-1)(0, -100, 80, 80);
  next.callbacks[0](0, 300, 80, 80); // Late measurement from the first request.
  h.reactUI(); h.flushJS();
  assert.equal(h.result.placement, 'up');
  h.unmount();
});

test('viewport and day identity changes invalidate the old control before remeasurement', () => {
  const h = setup(), node = nativeNode();
  h.result.todayRef(node); node.measured(300); h.reactUI(); h.flushJS();
  assert.equal(h.result.placement, 'on-screen');
  h.render({ visibleBottom: 150 });
  assert.equal(h.result.placement, 'pending');
  node.callbacks.at(-1)(0, 300, 80, 80); h.reactUI(); h.flushJS();
  assert.equal(h.result.placement, 'down');
  h.render({ nodeKey: 'second:tomorrow' });
  assert.equal(h.result.placement, 'pending');
  h.unmount();
});

test('ten attach, scroll, jump and detach cycles remain bounded and mutually exclusive', () => {
  const h = setup();
  for (let cycle = 0; cycle < 10; cycle++) {
    h.options.scrollY.value = 0;
    const node = nativeNode();
    h.result.todayRef(node); node.measured(300); h.reactUI(); h.flushJS();
    assert.equal(h.result.placement, 'on-screen');
    h.options.scrollY.value = 800; h.reactUI(); h.flushJS();
    assert.equal(h.result.placement, 'up');
    h.result.jump();
    assert.equal(h.scrolls.at(-1).y, 0);
    h.result.todayRef(null); h.render();
    assert.equal(h.result.placement, 'pending');
    assert.equal(h.frames, 0);
  }
  h.unmount();
});
