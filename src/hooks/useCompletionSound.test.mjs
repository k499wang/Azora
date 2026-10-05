import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { createCompletionSoundPlayback } from '../services/audio/completionSoundPlayback.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useCompletionSound.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const flush = () => new Promise((resolve) => setImmediate(resolve));

function mount() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let loaded = false;
  let focused = true;
  let preferencesLoaded = true;
  const preferences = { soundEffects: true };
  const calls = [];
  const listeners = new Set();
  const player = {
    volume: 0,
    pause() { calls.push('pause'); },
    async seekTo(seconds) { calls.push(['seek', seconds]); },
    play() { calls.push('play'); },
  };
  const appState = {
    currentState: 'active',
    addEventListener(event, listener) {
      assert.equal(event, 'change');
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo(factory, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !deps.every((dep, i) => dep === previous.deps[i])) {
        slots[index] = { deps, value: factory() };
      }
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((dep, i) => dep === previous.deps[i])) return;
      slots[index] = { deps };
      effects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, __DEV__: false,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native') return { AppState: appState };
      if (name === '@react-navigation/native') return { useIsFocused: () => focused };
      if (name === 'expo-audio') return {
        useAudioPlayer: () => player,
        setAudioModeAsync: async (mode) => { calls.push(['configure', mode.playsInSilentMode]); },
      };
      if (name.endsWith('/audioSettings/preferences')) return { getAudioPreferences: () => preferences };
      if (name.endsWith('/useAudioPreferences')) return { useAudioPreferences: () => ({ preferences, loaded: preferencesLoaded }) };
      if (name.endsWith('/completionSoundPlayback')) return { createCompletionSoundPlayback };
      if (name === './useAudioLoaded') return { useAudioLoaded: () => loaded };
      if (name.endsWith('.wav')) return name;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    calls,
    render(options = { active: true }) {
      cursor = 0;
      effects = [];
      const play = exports.useCompletionSound('streak', options);
      effects.forEach((run) => run());
      return play;
    },
    setLoaded(value) { loaded = value; },
    setPreferencesLoaded(value) { preferencesLoaded = value; },
    setEnabled(value) { preferences.soundEffects = value; },
    setFocused(value) { focused = value; },
    setAppState(value) {
      appState.currentState = value;
      for (const listener of [...listeners]) listener(value);
    },
  };
}

test('a hidden popup cancels its loading cue and a later popup can play', async () => {
  const hook = mount();
  assert.equal(hook.render()(), true);
  hook.render({ active: false });
  hook.setLoaded(true);
  hook.render({ active: false });
  await flush();
  assert.equal(hook.calls.includes('play'), false);
  const show = hook.render({ active: true });
  assert.equal(show(), true);
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'play').length, 1);
  hook.render({ active: false });
  hook.render({ active: true })();
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'play').length, 2);
});

test('backgrounding cancels a pending cue before the asset becomes ready', async () => {
  const hook = mount();
  hook.render()();
  hook.setAppState('background');
  hook.setLoaded(true);
  hook.render();
  await flush();
  assert.equal(hook.calls.includes('play'), false);
  hook.setAppState('active');
  hook.render()();
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'play').length, 1);
});

test('readiness waits for preferences and respects a live opt-out', async () => {
  const hook = mount();
  hook.setLoaded(true);
  hook.setPreferencesLoaded(false);
  hook.render()();
  await flush();
  assert.equal(hook.calls.includes('play'), false);
  hook.setEnabled(false);
  hook.setPreferencesLoaded(true);
  assert.equal(hook.render()(), false);
  await flush();
  assert.equal(hook.calls.includes('play'), false);
});

test('autoplay waits for focus and foreground, then runs once', async () => {
  const hook = mount();
  hook.setLoaded(true);
  hook.setFocused(false);
  hook.render({ autoPlay: true });
  await flush();
  assert.equal(hook.calls.includes('play'), false);
  hook.setFocused(true);
  hook.setAppState('inactive');
  hook.render({ autoPlay: true });
  await flush();
  assert.equal(hook.calls.includes('play'), false);
  hook.setAppState('active');
  hook.render({ autoPlay: true });
  await flush();
  hook.render({ autoPlay: true });
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'play').length, 1);
  assert.ok(hook.calls.some((call) => Array.isArray(call) && call[0] === 'configure' && call[1] === true));
});
