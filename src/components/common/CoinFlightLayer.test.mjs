import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ deferred = false, reducedMotion = false } = {}) {
  const hooks = [];
  const pendingMeasures = [];
  const flights = [];
  const stops = [];
  const visibility = [];
  let cursor = 0;
  let now = 1000;
  const ref = { current: null };
  const measurement = {
    measureInWindow(callback) {
      if (deferred) pendingMeasures.push(callback);
      else callback(10, 20, 300, 50);
    },
  };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    forwardRef: (component) => component,
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (next) => { hooks[index] = next; }];
    },
    useEffect(callback) {
      const index = cursor++;
      if (!(index in hooks)) { hooks[index] = true; callback(); }
    },
    useImperativeHandle(target, callback) { target.current = callback(); },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL('./CoinFlightLayer.tsx', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText, {
    exports,
    Date: { now: () => now },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      };
      if (name === 'react-native') return {
        View: 'View',
        StyleSheet: { create: (styles) => styles, absoluteFill: {} },
        InteractionManager: { runAfterInteractions: (callback) => { callback(); return { cancel() {} }; } },
      };
      if (name === 'react-native-reanimated') return { useReducedMotion: () => reducedMotion };
      if (name.endsWith('useWhileVisible')) return {
        useWhileVisible(start) {
          const index = cursor++;
          if (!(index in hooks)) {
            hooks[index] = true;
            visibility.push({ start, stop: start() });
          }
        },
      };
      return {};
    },
  });
  const render = () => {
    cursor = 0;
    const tree = exports.default({ targetRef: { current: measurement } }, ref);
    tree.props.ref.current = measurement;
    const children = tree.props.children ?? [];
    children.forEach((child, slot) => child.props.ref({
      fire: (path, delayMs) => flights.push({ slot, path, delayMs, now }),
      stop: () => stops.push(slot),
    }));
    return children.length;
  };
  render();
  const poolSize = render();
  return {
    poolSize,
    flights,
    stops,
    launch: (coins = 20) => ref.current.launch({ coins, from: { x: 80, y: 100 } }),
    advance: (ms) => { now += ms; },
    blur: () => visibility[0].stop(),
    focus: () => { visibility[0].stop = visibility[0].start(); },
    measure: () => pendingMeasures.splice(0).forEach((callback) => callback(10, 20, 300, 50)),
  };
}

test('rapid launches saturate the fixed pool without replacing occupied flights', async () => {
  const harness = setup();
  assert.equal(harness.poolSize, 24);
  for (let i = 0; i < 5; i++) harness.launch();
  await new Promise(setImmediate);
  assert.equal(harness.flights.length, 24);
  assert.equal(new Set(harness.flights.map(({ slot }) => slot)).size, 24);
});

test('slots become reusable only after their travel and individual stagger finish', async () => {
  const harness = setup();
  harness.launch();
  harness.launch();
  harness.launch();
  await new Promise(setImmediate);
  harness.advance(759);
  harness.launch();
  await new Promise(setImmediate);
  assert.equal(harness.flights.length, 24);
  harness.advance(1);
  harness.launch();
  await new Promise(setImmediate);
  assert.equal(harness.flights.length, 27);
  assert.deepEqual(harness.flights.slice(24).map(({ slot }) => slot).sort((a, b) => a - b), [0, 10, 20]);
  harness.advance(1200);
  harness.launch();
  await new Promise(setImmediate);
  assert.equal(harness.flights.length, 37);
});

test('a deferred native measurement cannot launch after blur, including refocus', async () => {
  const harness = setup({ deferred: true });
  harness.launch();
  harness.blur();
  assert.equal(harness.stops.length, 24);
  harness.focus();
  harness.measure();
  await new Promise(setImmediate);
  assert.equal(harness.flights.length, 0);
  harness.launch();
  harness.measure();
  await new Promise(setImmediate);
  assert.equal(harness.flights.length, 10);
});

test('reduced motion and background visibility prevent decorative launches', async () => {
  const reduced = setup({ reducedMotion: true });
  reduced.launch();
  const hidden = setup();
  hidden.blur();
  hidden.launch();
  await new Promise(setImmediate);
  assert.equal(reduced.flights.length, 0);
  assert.equal(hidden.flights.length, 0);
});
