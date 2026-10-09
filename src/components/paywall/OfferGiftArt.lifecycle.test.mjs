import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ reducedMotion = false, focusedInitially = true } = {}) {
  const hooks = [];
  const effects = [];
  const listeners = new Map();
  const nativeWork = new Set();
  const timers = new Set();
  const cues = { sounds: 0, haptics: 0 };
  let cursor = 0;
  let focused = focusedInitially;
  const stable = (create) => {
    const index = cursor++;
    if (!(index in hooks)) hooks[index] = create();
    return hooks[index];
  };
  const subscribe = (event, listener) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(listener);
    return () => listeners.get(event).delete(listener);
  };
  const appState = {
    currentState: 'active',
    addEventListener: (_, listener) => ({ remove: subscribe('app', listener) }),
  };
  const navigation = {
    isFocused: () => focused,
    addListener: subscribe,
  };
  const react = {
    useContext: () => navigation,
    useId: () => stable(() => 'gift-test'),
    useRef: (initial) => stable(() => ({ current: initial })),
    useEffect(callback, dependencies) {
      const state = stable(() => ({}));
      if (state.dependencies && dependencies.every((value, index) => Object.is(value, state.dependencies[index]))) return;
      state.cleanup?.();
      state.dependencies = dependencies;
      effects.push(() => { state.cleanup = callback(); });
    },
  };
  const animation = (...args) => ({ animation: true, args });
  const reanimated = {
    default: { View: 'AnimatedView' },
    Easing: { linear: 'linear' },
    useReducedMotion: () => reducedMotion,
    useAnimatedStyle: () => ({}),
    useSharedValue(initial) {
      return stable(() => {
        let current = initial;
        const shared = {
          get value() { return current; },
          set value(next) {
            if (next?.animation) nativeWork.add(shared);
            else { nativeWork.delete(shared); current = next; }
          },
        };
        return shared;
      });
    },
    cancelAnimation: (shared) => nativeWork.delete(shared),
    withDelay: animation,
    withRepeat: animation,
    withSpring: animation,
    withTiming: animation,
  };
  const cache = new Map();
  function load(url) {
    if (cache.has(url.href)) return cache.get(url.href);
    const exports = {};
    cache.set(url.href, exports);
    vm.runInNewContext(ts.transpileModule(readFileSync(url, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, {
      exports,
      require(name) {
        if (name === 'react') return react;
        if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
        if (name === 'react-native') return { View: 'View', AppState: appState, StyleSheet: { create: (styles) => styles, absoluteFill: {} } };
        if (name === 'react-native-reanimated') return reanimated;
        if (name === 'react-native-svg') return new Proxy({}, { get: (_, key) => String(key) });
        if (name === '@react-navigation/native') return { NavigationContext: {} };
        if (name.endsWith('/motion')) return { easing: { breathe: 'breathe' }, spring: { pop: {} } };
        if (name.endsWith('/tapHaptics')) return { triggerMediumHaptic: () => cues.haptics++ };
        if (name.endsWith('/useCompletionSound')) return { useCompletionSound: () => () => cues.sounds++ };
        if (name.endsWith('/uiThreadTimer')) return {
          startUiTimer(delay, callback) {
            const timer = { delay, callback };
            timers.add(timer);
            return () => timers.delete(timer);
          },
        };
        if (name.startsWith('.')) {
          const dependency = new URL(`${name}.ts`, url);
          return load(existsSync(dependency) ? dependency : new URL(`${name}.tsx`, url));
        }
        throw new Error(`Unexpected module ${name}`);
      },
    });
    return exports;
  }
  const component = load(new URL('./OfferGiftArt.tsx', import.meta.url)).default;
  return {
    render() {
      cursor = 0;
      const tree = component({ size: 240, delay: 1000 });
      effects.splice(0).forEach((effect) => effect());
      return tree;
    },
    focus(value) {
      focused = value;
      listeners.get(value ? 'focus' : 'blur')?.forEach((listener) => listener());
    },
    foreground(value) {
      appState.currentState = value ? 'active' : 'background';
      listeners.get('app')?.forEach((listener) => listener());
    },
    fireTimers() {
      [...timers].forEach((timer) => { timers.delete(timer); timer.callback(); });
    },
    unmount: () => hooks.forEach((slot) => slot?.cleanup?.()),
    listenerCount: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
    nativeWork, timers, cues,
  };
}

test('gift animation tears down on blur/background and remains bounded through ten returns', () => {
  const harness = setup({ focusedInitially: false });
  harness.render();
  assert.equal(harness.nativeWork.size, 0);
  assert.equal(harness.timers.size, 0);
  harness.focus(true);
  assert.ok(harness.nativeWork.size > 0);
  assert.equal(harness.timers.size, 1);
  harness.fireTimers();
  assert.deepEqual(harness.cues, { sounds: 1, haptics: 1 });
  const runningCount = harness.nativeWork.size;
  const listenerCount = harness.listenerCount();
  for (let cycle = 0; cycle < 10; cycle++) {
    harness.focus(false);
    assert.equal(harness.nativeWork.size, 0);
    assert.equal(harness.timers.size, 0);
    harness.focus(true);
    assert.ok(harness.nativeWork.size > 0 && harness.nativeWork.size <= runningCount);
    harness.foreground(false);
    assert.equal(harness.nativeWork.size, 0);
    harness.foreground(true);
    harness.render();
    harness.fireTimers();
    assert.equal(harness.listenerCount(), listenerCount);
    assert.deepEqual(harness.cues, { sounds: 1, haptics: 1 });
  }
  harness.unmount();
  assert.equal(harness.nativeWork.size, 0);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.listenerCount(), 0);
});

test('leaving before the lid opens cancels its feedback cue', () => {
  const harness = setup();
  harness.render();
  assert.equal(harness.timers.size, 1);
  harness.foreground(false);
  harness.fireTimers();
  assert.equal(harness.nativeWork.size, 0);
  assert.deepEqual(harness.cues, { sounds: 0, haptics: 0 });
  harness.unmount();
});

test('reduced motion renders a still gift without animations or feedback timers', () => {
  const harness = setup({ reducedMotion: true });
  assert.ok(harness.render());
  assert.equal(harness.nativeWork.size, 0);
  assert.equal(harness.timers.size, 0);
  assert.deepEqual(harness.cues, { sounds: 0, haptics: 0 });
  harness.unmount();
  assert.equal(harness.listenerCount(), 0);
});
