import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const hooks = [];
  const effects = [];
  const listeners = new Map();
  const appListeners = new Set();
  const timers = new Map();
  const idle = new Map();
  let nextIdle = 0;
  let cursor = 0;
  let nextTimer = 0;
  let focused = true;
  let now = 0;
  let toast;
  const stable = (create) => {
    const index = cursor++;
    if (!(index in hooks)) hooks[index] = create();
    return hooks[index];
  };
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
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(listener);
      return () => listeners.get(event).delete(listener);
    },
  };
  const react = {
    forwardRef: (render) => render,
    useRef: (initial) => stable(() => ({ current: initial })),
    useContext: () => navigation,
    useState(initial) {
      const state = stable(() => ({ value: initial }));
      return [state.value, (update) => { state.value = typeof update === 'function' ? update(state.value) : update; }];
    },
    useImperativeHandle: (ref, create) => { ref.current = create(); },
    useEffect(callback, dependencies) {
      const state = stable(() => ({}));
      if (state.dependencies && dependencies.every((value, index) => Object.is(value, state.dependencies[index]))) return;
      state.cleanup?.();
      state.dependencies = dependencies;
      effects.push(() => { state.cleanup = callback(); });
    },
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
      requestIdleCallback(callback) { idle.set(++nextIdle, callback); return nextIdle; },
      cancelIdleCallback(id) { idle.delete(id); },
      setTimeout(callback, delay) { timers.set(++nextTimer, { callback, at: now + delay }); return nextTimer; },
      clearTimeout: (id) => timers.delete(id),
      require(name) {
        if (name === 'react') return react;
        if (name === 'react/jsx-runtime') return {
          jsx(type, props) { if (type === 'Toast') toast = props; return null; },
          jsxs: () => null,
        };
        if (name === 'react-native') return { View: 'View', StyleSheet: { create: (styles) => styles }, AppState: appState };
        if (name === '@react-navigation/native') return { NavigationContext: {} };
        if (name.endsWith('/uiThreadTimer')) return {
          startUiTimer(delay, callback) {
            const id = ++nextTimer;
            timers.set(id, { callback, at: now + delay });
            return () => timers.delete(id);
          },
        };
        if (name.endsWith('/Confetti')) return { default: 'Confetti' };
        if (name.endsWith('/CelebrationToast')) return { default: 'Toast' };
        if (name.endsWith('/backgroundImageCache')) return { loadBackgroundImage: () => Promise.resolve() };
        if (name.endsWith('/colors')) return { colors: { primary: {}, success: {} } };
        if (name.endsWith('/spacing')) return { spacing: {} };
        if (name.startsWith('.')) return load(new URL(`${name}.ts`, url));
        throw new Error(`Unexpected module ${name}`);
      },
    });
    return exports;
  }
  const component = load(new URL('./HomeCelebrationLayer.tsx', import.meta.url)).default;
  const ref = {};
  return {
    render(active = true, commitEffects = true) {
      cursor = 0;
      toast = { visible: false };
      component({ tabBarHeight: 50, active }, ref);
      if (commitEffects) effects.splice(0).forEach((effect) => effect());
      return toast;
    },
    confirm: (detail) => ref.current.confirm(detail),
    advance(ms) {
      now += ms;
      [...timers.entries()].forEach(([id, timer]) => {
        if (timer.at <= now && timers.delete(id)) timer.callback();
      });
    },
    focus(value) {
      focused = value;
      listeners.get(value ? 'focus' : 'blur')?.forEach((listener) => listener());
    },
    foreground(value) {
      appState.currentState = value ? 'active' : 'background';
      appListeners.forEach((listener) => listener());
    },
    unmount: () => hooks.forEach((hook) => hook?.cleanup?.()),
    timers,
    idle,
    prepare() {
      const callbacks = [...idle.values()];
      idle.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

test('confirmation expires from the imperative event even when React has not committed another render', () => {
  const harness = setup();
  harness.render();
  harness.confirm('First');
  assert.equal(harness.timers.size, 1);
  harness.advance(2200);
  assert.equal(harness.render().visible, false);
  harness.unmount();
});

test('confetti preparation is cancelled when hidden and runs once across repeated visits', () => {
  const harness = setup();
  harness.focus(false);
  harness.render();
  assert.equal(harness.idle.size, 0);
  harness.focus(true);
  assert.equal(harness.idle.size, 1);
  harness.foreground(false);
  assert.equal(harness.idle.size, 0);
  harness.foreground(true);
  assert.equal(harness.idle.size, 1);
  harness.prepare();
  harness.render();
  for (let cycle = 0; cycle < 10; cycle++) {
    harness.focus(false);
    harness.focus(true);
    assert.equal(harness.idle.size, 0);
  }
  harness.unmount();
});

test('rapid confirmations restart one deadline and stale callbacks cannot dismiss the latest toast', () => {
  const harness = setup();
  harness.render();
  harness.confirm('First');
  const staleCallback = [...harness.timers.values()][0].callback;
  harness.advance(1000);
  for (let i = 0; i < 10; i++) harness.confirm(`Tick ${i}`);
  assert.equal(harness.timers.size, 1);
  staleCallback();
  assert.equal(harness.render().visible, true);
  assert.equal(harness.render().detail, 'Tick 9');
  harness.advance(2199);
  assert.equal(harness.render().visible, true);
  harness.advance(1);
  assert.equal(harness.render().visible, false);
  harness.unmount();
});

test('blur, background, inactive and unmount each cancel the deadline and reject hidden confirmations', () => {
  for (const stop of ['blur', 'background', 'inactive', 'unmount']) {
    const harness = setup();
    harness.render();
    harness.confirm('First');
    const staleCallback = [...harness.timers.values()][0].callback;
    if (stop === 'blur') harness.focus(false);
    if (stop === 'background') harness.foreground(false);
    if (stop === 'inactive') harness.render(false);
    if (stop === 'unmount') harness.unmount();
    assert.equal(harness.timers.size, 0, stop);
    harness.confirm('Hidden');
    assert.equal(harness.timers.size, 0, stop);
    if (stop === 'unmount') continue;
    if (stop === 'blur') harness.focus(true);
    if (stop === 'background') harness.foreground(true);
    if (stop === 'inactive') harness.render(true);
    harness.confirm('New visit');
    staleCallback();
    assert.equal(harness.render().visible, true, stop);
    assert.equal(harness.render().detail, 'New visit', stop);
    harness.unmount();
  }
});
