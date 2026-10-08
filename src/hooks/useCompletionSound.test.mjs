import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { createCompletionSoundPlayback } from '../services/audio/completionSoundPlayback.ts';
import { createNativeCompletionSoundPlayback } from '../services/audio/nativeCompletionSoundPlayback.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useCompletionSound.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const flush = () => new Promise((resolve) => setImmediate(resolve));

function mount({ native = false, scheduling = true } = {}) {
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
  const nativePlayer = {
    async prepare() { calls.push('nativePrepare'); },
    async restart() { calls.push('nativeRestart'); },
    async stop() { calls.push('nativeStop'); },
    async release() { calls.push('nativeRelease'); },
  };
  if (scheduling) nativePlayer.schedule = async (_owner, _volume, deadline) => {
    calls.push(['nativeSchedule', deadline]);
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
        useAudioPlayer: (source) => { if (native) assert.equal(source, null); return player; },
        setAudioModeAsync: async (mode) => { calls.push(['configure', mode.playsInSilentMode]); },
      };
      if (name.endsWith('/audioSettings/preferences')) return { getAudioPreferences: () => preferences };
      if (name.endsWith('/useAudioPreferences')) return { useAudioPreferences: () => ({ preferences, loaded: preferencesLoaded }) };
      if (name.endsWith('/completionSoundPlayback')) return { createCompletionSoundPlayback };
      if (name.endsWith('/nativeCompletionSoundPlayback')) return { createNativeCompletionSoundPlayback };
      if (name.endsWith('/completionAudio')) return {
        completionAudioNative: native ? nativePlayer : null,
        loadCompletionAudioUri: async () => 'file:///completion.wav',
      };
      if (name === './useAudioLoaded') return { useAudioLoaded: () => loaded };
      if (name.endsWith('.wav')) return name;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    calls,
    render(options = { active: true }, kind = 'streak') {
      cursor = 0;
      effects = [];
      const play = exports.useCompletionSound(kind, options);
      effects.forEach((run) => run());
      return play;
    },
    setLoaded(value) { loaded = value; },
    setPreferencesLoaded(value) { preferencesLoaded = value; },
    setEnabled(value) { preferences.soundEffects = value; },
    setFocused(value) { focused = value; },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
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

test('iOS completion uses asynchronous native restarts and releases its player on unmount', async () => {
  const hook = mount({ native: true });
  const play = hook.render({ active: true }, 'todo');
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'nativePrepare').length, 1);
  assert.equal(play(), true);
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'nativeRestart').length, 1);
  assert.equal(hook.calls.some((call) => Array.isArray(call) && call[0] === 'seek'), false);
  assert.equal(hook.calls.includes('play'), false);
  hook.setAppState('background');
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'nativeStop').length, 1);
  assert.equal(play(), false);
  hook.unmount();
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'nativeRelease').length, 1);
});

test('routine ticks accept rapid restarts and play the latest cue', async () => {
  const hook = mount();
  hook.setLoaded(true);
  const play = hook.render({ active: true }, 'todo');
  assert.equal(play(), true);
  for (let tick = 0; tick < 10; tick++) assert.equal(play(), true);
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'play').length, 1);
  assert.equal(play(), true);
  await flush();
  assert.equal(hook.calls.filter((call) => call === 'play').length, 2);
  hook.render({ active: false }, 'todo');
  assert.equal(hook.calls.filter((call) => call === 'pause').length, 1);
});

for (const native of [false, true]) {
  test(`${native ? 'native' : 'Expo'} immediate timed feedback never queues a cue while loading`, async () => {
    const hook = mount({ native });
    const play = hook.render({ active: true }, 'cardPop');
    assert.equal(play.playIfReady(), false);
    hook.setLoaded(true);
    hook.render({ active: true }, 'cardPop');
    await flush();
    assert.equal(hook.calls.includes(native ? 'nativeRestart' : 'play'), false);
    assert.equal(play.playIfReady(), true);
    await flush();
    assert.equal(hook.calls.includes(native ? 'nativeRestart' : 'play'), true);
    hook.unmount();
  });
}

test('native scheduled feedback honors the live mute preference and cancels on inactivity', async () => {
  const hook = mount({ native: true });
  const play = hook.render({ active: true }, 'cardPop');
  await flush();
  const deadline = Date.now() + 500;
  assert.equal(play.scheduleAt(deadline), true);
  assert.ok(hook.calls.some((call) => Array.isArray(call) && call[0] === 'nativeSchedule' && call[1] === deadline));
  hook.setAppState('inactive');
  assert.equal(play.scheduleAt(deadline), false);
  assert.ok(hook.calls.includes('nativeStop'));
  hook.setAppState('active');
  hook.render({ active: true }, 'cardPop');
  await flush();
  hook.setEnabled(false);
  assert.equal(play.scheduleAt(deadline), false);
  assert.equal(play.playIfReady(), false);
  hook.unmount();
});

test('old iOS binaries decline scheduling and keep the ready immediate fallback', async () => {
  const hook = mount({ native: true, scheduling: false });
  const play = hook.render({ active: true }, 'cardPop');
  await flush();
  assert.equal(play.scheduleAt(Date.now() + 500), false);
  assert.equal(play.playIfReady(), true);
  await flush();
  assert.equal(hook.calls.includes('nativeRestart'), true);
  hook.unmount();
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

for (const native of [false, true]) {
  const backend = native ? 'native' : 'Expo';
  const played = native ? 'nativeRestart' : 'play';
  const stopped = native ? 'nativeStop' : 'pause';

  test(`${backend} attention cues stop on blur and do not replay on return`, async () => {
    const hook = mount({ native });
    hook.setLoaded(true);
    hook.render({ active: true }, 'attentionSqueeze')();
    await flush();
    assert.equal(hook.calls.filter((call) => call === played).length, 1);
    hook.setFocused(false);
    assert.equal(hook.render({ active: true }, 'attentionSqueeze')(), false);
    await flush();
    assert.ok(hook.calls.includes(stopped));
    hook.setFocused(true);
    hook.render({ active: true }, 'attentionSqueeze');
    await flush();
    assert.equal(hook.calls.filter((call) => call === played).length, 1);
    hook.unmount();
  });

  test(`${backend} a finishOnBlur cue tapped just before navigating is not cut off`, async () => {
    const hook = mount({ native });
    hook.setLoaded(true);
    const options = { active: true, finishOnBlur: true };
    assert.equal(hook.render(options, 'pathTap')(), true);
    hook.setFocused(false);
    hook.render(options, 'pathTap');
    await flush();
    assert.equal(hook.calls.filter((call) => call === played).length, 1);
    assert.equal(hook.calls.includes(stopped), false);
    assert.equal(hook.render(options, 'pathTap')(), false);
    hook.unmount();
  });

  test(`${backend} attention cues recheck the live mute setting before playing`, async () => {
    const hook = mount({ native });
    hook.setLoaded(true);
    const play = hook.render({ active: true }, 'attentionSense5');
    await flush();
    hook.setEnabled(false);
    // This callback was captured before the preferences rerender.
    assert.equal(play(), false);
    await flush();
    assert.equal(hook.calls.includes(played), false);
    hook.render({ active: true }, 'attentionSense5');
    hook.setEnabled(true);
    hook.render({ active: true }, 'attentionSense5');
    await flush();
    assert.equal(hook.calls.includes(played), false);
    assert.equal(hook.render({ active: true }, 'attentionSense5')(), true);
    await flush();
    assert.equal(hook.calls.filter((call) => call === played).length, 1);
    hook.unmount();
  });

  test(`${backend} attention cues stop immediately when the app becomes inactive`, async () => {
    const hook = mount({ native });
    hook.setLoaded(true);
    const play = hook.render({ active: true }, 'attentionRelease');
    play();
    await flush();
    hook.setAppState('inactive');
    assert.equal(play(), false);
    await flush();
    assert.ok(hook.calls.includes(stopped));
    hook.setAppState('active');
    hook.render({ active: true }, 'attentionRelease');
    await flush();
    assert.equal(hook.calls.filter((call) => call === played).length, 1);
    hook.unmount();
  });
}
