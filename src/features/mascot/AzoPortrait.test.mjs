import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real component and visibility hook; only rendering and native
// animation scheduling are replaced, so focus changes need no React rerender.
function setup() {
  const hooks = [];
  const effects = [];
  const focusListeners = new Map();
  const appListeners = new Set();
  const animations = new Map();
  const frames = [];
  const cache = new Map();
  let cursor = 0;
  let focused = true;
  const appState = {
    currentState: 'active',
    addEventListener(_, listener) {
      appListeners.add(listener);
      return { remove: () => appListeners.delete(listener) };
    },
  };
  const navigation = {
    isFocused: () => focused,
    addListener(event, listener) {
      if (!focusListeners.has(event)) focusListeners.set(event, new Set());
      focusListeners.get(event).add(listener);
      return () => focusListeners.get(event).delete(listener);
    },
  };
  const stable = (create) => {
    const index = cursor++;
    if (!(index in hooks)) hooks[index] = create();
    return hooks[index];
  };
  const react = {
    forwardRef: (render) => render,
    memo: (render) => render,
    useCallback: (callback) => callback,
    useContext: () => navigation,
    useImperativeHandle: (ref, create) => { ref.current = create(); },
    useEffect(callback, dependencies) {
      const state = stable(() => ({}));
      if (state.dependencies && dependencies.every((value, index) => Object.is(value, state.dependencies[index]))) return;
      state.cleanup?.();
      state.dependencies = dependencies;
      effects.push(() => { state.cleanup = callback(); });
    },
  };
  const animation = (kind) => (...values) => ({ kind, values });
  const reanimated = {
    default: { createAnimatedComponent: (component) => component, View: 'View' },
    cancelAnimation: (value) => animations.delete(value),
    useSharedValue(initial) {
      return stable(() => {
        let current = initial;
        const shared = {};
        Object.defineProperty(shared, 'value', {
          get: () => current,
          set(value) {
            current = value;
            if (value?.kind) animations.set(shared, value);
            else animations.delete(shared);
          },
        });
        return shared;
      });
    },
    useReducedMotion: () => false,
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    useDerivedValue: () => ({ value: 0 }),
    useFrameCallback(callback, autostart = true) {
      return stable(() => {
        const frame = { isActive: autostart, setActive(value) { this.isActive = value; } };
        frames.push(frame);
        return frame;
      });
    },
    withTiming: animation('timing'),
    withRepeat: animation('repeat'),
    withDelay: animation('delay'),
    withSequence: animation('sequence'),
  };
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
        if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
        if (name === 'react-native') return { AppState: appState, StyleSheet: { create: (value) => value }, View: 'View' };
        if (name === '@react-navigation/native') return { NavigationContext: {} };
        if (name === 'react-native-reanimated') return reanimated;
        if (name === 'react-native-svg') return { default: 'Svg', Circle: 'Circle', Path: 'Path' };
        if (name.endsWith('/colors')) return { colors: { koala: {} } };
        if (name.endsWith('/motion')) return { duration: {}, easing: {} };
        if (name.startsWith('.')) return load(new URL(`${name}.ts`, url));
        throw new Error(`Unexpected module ${name}`);
      },
    });
    return exports;
  }
  const component = load(new URL('./AzoPortrait.tsx', import.meta.url)).default;
  const ref = {};
  return {
    render(active = true) {
      cursor = 0;
      component({ size: 100, active }, ref);
      effects.splice(0).forEach((effect) => effect());
    },
    focus(value) {
      focused = value;
      focusListeners.get(value ? 'focus' : 'blur')?.forEach((listener) => listener());
    },
    foreground(value) {
      appState.currentState = value ? 'active' : 'background';
      appListeners.forEach((listener) => listener());
    },
    cheer: () => ref.current.cheer(),
    unmount: () => hooks.forEach((hook) => hook?.cleanup?.()),
    get loops() { return [...animations.values()].filter((value) => value.kind === 'repeat').length; },
    get animations() { return animations.size; },
    get activeFrames() { return frames.filter((frame) => frame.isActive).length; },
    get listeners() { return appListeners.size + [...focusListeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
}

test('portrait suspends loops, reactions and frame physics on blur and background across ten visits', () => {
  const harness = setup();
  harness.render();
  const listenerCount = harness.listeners;
  for (let visit = 0; visit < 10; visit++) {
    assert.equal(harness.loops, 2);
    assert.equal(harness.activeFrames, 1);
    harness.cheer();
    assert.equal(harness.animations, 5);
    harness.focus(false);
    assert.equal(harness.animations, 0);
    assert.equal(harness.activeFrames, 0);
    harness.cheer();
    assert.equal(harness.animations, 0);
    harness.focus(true);
    assert.equal(harness.loops, 2);
    assert.equal(harness.activeFrames, 1);
    harness.foreground(false);
    assert.equal(harness.animations, 0);
    assert.equal(harness.activeFrames, 0);
    harness.cheer();
    assert.equal(harness.animations, 0);
    harness.foreground(true);
    assert.equal(harness.listeners, listenerCount);
  }
  harness.unmount();
  assert.equal(harness.animations, 0);
  assert.equal(harness.activeFrames, 0);
  assert.equal(harness.listeners, 0);
});

test('explicitly inactive portrait stops physics and loops and rejects a cheer until reactivated', () => {
  const harness = setup();
  harness.render();
  harness.cheer();
  harness.render(false);
  assert.equal(harness.animations, 0);
  assert.equal(harness.activeFrames, 0);
  harness.cheer();
  assert.equal(harness.animations, 0);
  harness.render(true);
  assert.equal(harness.loops, 2);
  assert.equal(harness.activeFrames, 1);
  harness.unmount();
});
