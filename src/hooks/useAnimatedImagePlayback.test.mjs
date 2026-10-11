import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
}

const compiledPlayback = compile('./useAnimatedImagePlayback.ts');
const compiledVisibility = compile('./useWhileVisible.ts');
const compiledRunner = compile('../lib/ui/runWhileVisible.ts');

function createImage(failure, drawableAttached = true) {
  const calls = [];
  let animating = false;
  const call = (name) => {
    calls.push(name);
    if (failure === 'throw') throw new Error('Detached native image');
    if (failure === 'reject') return Promise.reject(new Error('Detached native image'));
    animating = name === 'start' && drawableAttached;
    return Promise.resolve();
  };
  return {
    calls,
    attachDrawable: () => { drawableAttached = true; },
    isAnimating: () => animating,
    startAnimating: () => call('start'),
    stopAnimating: () => call('stop'),
  };
}

function setup() {
  const slots = [];
  const focusListeners = new Set();
  const blurListeners = new Set();
  const appListeners = new Set();
  let cursor = 0;
  let focused = true;
  let pendingEffects = [];
  let current;
  const appState = {
    currentState: 'active',
    addEventListener(_event, callback) {
      appListeners.add(callback);
      return { remove: () => appListeners.delete(callback) };
    },
  };
  const navigation = {
    isFocused: () => focused,
    addListener(event, callback) {
      const listeners = event === 'focus' ? focusListeners : blurListeners;
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
  const changed = (previous, dependencies) => !previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]));
  const react = {
    useContext: () => navigation,
    useMemo(create, dependencies) {
      const index = cursor++;
      if (changed(slots[index], dependencies)) slots[index] = { value: create(), dependencies };
      return slots[index].value;
    },
    useCallback(callback, dependencies) { return react.useMemo(() => callback, dependencies); },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (changed(slots[index], dependencies)) pendingEffects.push({ index, effect, dependencies });
    },
  };
  const runner = {};
  vm.runInNewContext(compiledRunner, { exports: runner });
  const visibility = {};
  vm.runInNewContext(compiledVisibility, {
    exports: visibility,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native') return { AppState: appState };
      if (name === '@react-navigation/native') return { NavigationContext: {} };
      if (name === '../lib/ui/runWhileVisible') return runner;
      throw new Error(`Unexpected visibility import: ${name}`);
    },
  });
  const playback = {};
  vm.runInNewContext(compiledPlayback, {
    exports: playback,
    require(name) {
      if (name === 'react') return react;
      if (name === './useWhileVisible') return visibility;
      throw new Error(`Unexpected playback import: ${name}`);
    },
  });
  const image = createImage();
  return {
    image,
    render(source = 1, active = true, nextImage = image) {
      cursor = 0;
      const next = playback.useAnimatedImagePlayback(source, active);
      if (current?.ref !== next.ref) {
        current?.ref(null);
        if (source != null) next.ref(nextImage);
      }
      current = next;
      for (const { index, effect, dependencies } of pendingEffects) {
        slots[index]?.cleanup?.();
        slots[index] = { dependencies, cleanup: effect() };
      }
      pendingEffects = [];
      return next;
    },
    focus(value) {
      focused = value;
      for (const listener of value ? focusListeners : blurListeners) listener();
    },
    appState(value) {
      appState.currentState = value;
      for (const listener of appListeners) listener();
    },
    unmount() {
      current?.ref(null);
      for (const slot of slots) slot?.cleanup?.();
    },
    listenerCount: () => focusListeners.size + blurListeners.size + appListeners.size,
  };
}

test('waits for display and starts once across repeated displays and rerenders', () => {
  const harness = setup();
  const playback = harness.render();
  assert.deepEqual(harness.image.calls, []);
  playback.onDisplay();
  playback.onDisplay();
  harness.render().onDisplay();
  assert.deepEqual(harness.image.calls, ['start']);
  harness.unmount();
});

test('a successful load before native drawable attachment waits for display to start playback', () => {
  const harness = setup();
  const image = createImage(undefined, false);
  const playback = harness.render(1, true, image);
  // expo-image can report a successful load before its native image view is ready.
  playback.onLoad?.();
  assert.deepEqual(image.calls, []);
  assert.equal(image.isAnimating(), false);
  image.attachDrawable();
  playback.onDisplay();
  assert.deepEqual(image.calls, ['start']);
  assert.equal(image.isAnimating(), true);
  playback.onDisplay();
  assert.deepEqual(image.calls, ['start'], 'repeated display events do not replay a one-shot animation');
  harness.unmount();
});

test('display while blurred waits for focus; background and foreground pause and resume', () => {
  const harness = setup();
  harness.focus(false);
  const playback = harness.render();
  playback.onDisplay();
  assert.deepEqual(harness.image.calls, []);
  harness.focus(true);
  assert.deepEqual(harness.image.calls, ['start']);
  harness.appState('inactive');
  assert.deepEqual(harness.image.calls, ['start', 'stop']);
  harness.appState('background');
  harness.focus(false);
  harness.appState('active');
  assert.deepEqual(harness.image.calls, ['start', 'stop']);
  harness.focus(true);
  assert.deepEqual(harness.image.calls, ['start', 'stop', 'start']);
  harness.unmount();
});

test('ten visibility cycles retain one subscription owner and stop each playback', () => {
  const harness = setup();
  harness.render().onDisplay();
  for (let cycle = 0; cycle < 10; cycle++) {
    harness.focus(false);
    harness.focus(true);
    harness.appState('background');
    harness.appState('active');
    harness.render();
    assert.equal(harness.listenerCount(), 3);
  }
  assert.equal(harness.image.calls.filter((call) => call === 'start').length, 21);
  assert.equal(harness.image.calls.filter((call) => call === 'stop').length, 20);
  harness.unmount();
  assert.equal(harness.listenerCount(), 0);
  assert.equal(harness.image.calls.at(-1), 'stop');
});

test('ref teardown and late displays cannot restart a detached image', () => {
  const harness = setup();
  const playback = harness.render();
  playback.onDisplay();
  playback.ref(null);
  playback.onDisplay();
  harness.focus(false);
  harness.focus(true);
  assert.deepEqual(harness.image.calls, ['start', 'stop']);
  harness.unmount();
  playback.onDisplay();
  assert.deepEqual(harness.image.calls, ['start', 'stop']);
});

test('a source replacement stops the old image and waits for the new source display', () => {
  const harness = setup();
  const oldPlayback = harness.render();
  oldPlayback.onDisplay();
  const replacement = createImage();
  const newPlayback = harness.render(2, true, replacement);
  assert.deepEqual(harness.image.calls, ['start', 'stop']);
  oldPlayback.onDisplay();
  assert.deepEqual(replacement.calls, []);
  newPlayback.onDisplay();
  assert.deepEqual(replacement.calls, ['start']);
  harness.unmount();
  newPlayback.onDisplay();
  assert.equal(replacement.calls.at(-1), 'stop');
});

test('inactive and reduced-motion owners never start until activated and displayed', () => {
  const harness = setup();
  harness.render(1, false).onDisplay();
  assert.deepEqual(harness.image.calls, []);
  harness.render(1, true);
  assert.deepEqual(harness.image.calls, ['stop', 'start']);
  harness.render(1, false).onDisplay();
  assert.deepEqual(harness.image.calls, ['stop', 'start', 'stop']);
  harness.appState('background');
  harness.appState('active');
  assert.equal(harness.image.calls.filter((call) => call === 'start').length, 1);
  harness.unmount();
});

for (const failure of ['throw', 'reject']) {
  test(`detached-native ${failure} errors do not escape playback or cleanup`, async () => {
    const harness = setup();
    const image = createImage(failure);
    const playback = harness.render(1, true, image);
    assert.doesNotThrow(() => playback.onDisplay());
    assert.doesNotThrow(() => harness.focus(false));
    assert.doesNotThrow(() => harness.unmount());
    await Promise.resolve();
  });
}
