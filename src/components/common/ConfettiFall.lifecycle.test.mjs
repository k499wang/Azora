import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ reducedMotion = false, focusedInitially = true, random = Math.random } = {}) {
  const instances = new Map();
  const effects = [];
  const focusListeners = new Map();
  const appListeners = new Set();
  const nativeWork = new Set();
  const starts = [];
  let focused = focusedInitially;
  let hooks;
  let cursor;
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
      if (!focusListeners.has(event)) focusListeners.set(event, new Set());
      focusListeners.get(event).add(listener);
      return () => focusListeners.get(event).delete(listener);
    },
  };
  const react = {
    useContext: () => navigation,
    useRef: (initial) => stable(() => ({ current: initial })),
    useMemo(create, dependencies) {
      const state = stable(() => ({}));
      if (!state.dependencies || dependencies.some((value, index) => !Object.is(value, state.dependencies[index]))) {
        state.value = create();
        state.dependencies = dependencies;
      }
      return state.value;
    },
    useEffect(callback, dependencies) {
      const state = stable(() => ({}));
      if (state.dependencies && dependencies.every((value, index) => Object.is(value, state.dependencies[index]))) return;
      state.cleanup?.();
      state.dependencies = dependencies;
      effects.push(() => { state.cleanup = callback(); });
    },
  };
  const animated = {
    View: 'AnimatedView',
    Value: class {
      constructor(value) { this.value = value; }
      setValue(value) { this.value = value; }
      interpolate(config) { return config; }
    },
    timing(value, options) {
      const work = {
        start() {
          starts.push({ value: value.value, options });
          nativeWork.add(work);
          value.value = 0.5;
        },
        stop: () => nativeWork.delete(work),
      };
      return work;
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
      Math: Object.assign(Object.create(Math), { random }),
      require(name) {
        if (name === 'react') return react;
        if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
        if (name === 'react-native') return {
          View: 'View', Animated: animated, AppState: appState,
          Easing: { linear: 'linear' }, StyleSheet: { create: (styles) => styles },
        };
        if (name === 'react-native-reanimated') return { useReducedMotion: () => reducedMotion };
        if (name === '@react-navigation/native') return { NavigationContext: {} };
        if (name.endsWith('/colors')) return { colors: { primary: {}, success: {}, orange: {} } };
        if (name.startsWith('.')) return load(new URL(`${name}.ts`, url));
        throw new Error(`Unexpected module ${name}`);
      },
    });
    return exports;
  }
  const component = load(new URL('./ConfettiFall.tsx', import.meta.url)).default;
  function renderComponent(type, props, key) {
    if (!instances.has(key)) instances.set(key, []);
    hooks = instances.get(key);
    cursor = 0;
    return type(props);
  }
  return {
    render(props = {}) {
      const tree = renderComponent(component, { count: 3, ...props }, 'root');
      tree?.props.children.forEach((piece, index) => renderComponent(piece.type, piece.props, index));
      effects.splice(0).forEach((effect) => effect());
      return tree;
    },
    focus(value) {
      focused = value;
      focusListeners.get(value ? 'focus' : 'blur')?.forEach((listener) => listener());
    },
    foreground(value) {
      appState.currentState = value ? 'active' : 'background';
      appListeners.forEach((listener) => listener());
    },
    unmount: () => instances.forEach((slots) => slots.forEach((slot) => slot?.cleanup?.())),
    listenerCount: () => appListeners.size + [...focusListeners.values()].reduce((total, listeners) => total + listeners.size, 0),
    nativeWork,
    starts,
  };
}

test('falling confetti stops native work on blur/background and restarts from zero through ten cycles', () => {
  const harness = setup({ focusedInitially: false });
  const tree = harness.render();
  assert.equal(tree.props.pointerEvents, 'none');
  assert.equal(tree.props.accessibilityElementsHidden, true);
  assert.equal(tree.props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(harness.nativeWork.size, 0);
  harness.focus(true);
  for (let cycle = 0; cycle < 10; cycle++) {
    assert.equal(harness.nativeWork.size, 3);
    harness.focus(false);
    assert.equal(harness.nativeWork.size, 0);
    harness.focus(true);
    harness.foreground(false);
    assert.equal(harness.nativeWork.size, 0);
    harness.foreground(true);
    harness.render();
    assert.equal(harness.nativeWork.size, 3);
    assert.equal(harness.listenerCount(), 9);
  }
  assert.ok(harness.starts.every(({ value, options }) => value === 0 && options.toValue === 1 && options.useNativeDriver));
  harness.unmount();
  assert.equal(harness.nativeWork.size, 0);
  assert.equal(harness.listenerCount(), 0);
});

test('reduced motion mounts no confetti pieces, native animations, or visibility listeners', () => {
  const harness = setup({ reducedMotion: true });
  assert.equal(harness.render(), null);
  assert.equal(harness.nativeWork.size, 0);
  assert.equal(harness.listenerCount(), 0);
  harness.unmount();
});

test('a slower fall varies piece speeds and entry times while preserving default timing', () => {
  let randomCalls = 0;
  const harness = setup({ random: () => (randomCalls++ % 10) / 10 });
  harness.render();
  assert.equal(harness.starts.length, 3);
  assert.ok(harness.starts.every(({ options }) =>
    options.duration >= 3000 && options.duration < 5200 && options.delay >= 0 && options.delay < 400));
  harness.render({ durationMs: 7000 });
  assert.equal(harness.starts.length, 6);
  const slowed = harness.starts.slice(3).map(({ options }) => options);
  assert.ok(slowed.every(({ duration, delay }) =>
    duration >= 5600 && duration < 9800 && delay >= 0 && delay < 2800));
  assert.equal(new Set(slowed.map(({ duration }) => duration)).size, 3);
  assert.equal(new Set(slowed.map(({ delay }) => delay)).size, 3);
  assert.equal(harness.nativeWork.size, 3);
  harness.unmount();
  assert.equal(harness.nativeWork.size, 0);
});
