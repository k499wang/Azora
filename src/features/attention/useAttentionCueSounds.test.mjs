import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { createCompletionSoundPlayback } from '../../services/audio/completionSoundPlayback.ts';
import { attentionCueFor } from './domain/attentionCues.ts';
import { ATTENTION_SCRIPTS } from './domain/attentionScripts.ts';

const compile = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const compiledSound = compile('../../hooks/useCompletionSound.ts');
const compiledCues = compile('./useAttentionCueSounds.ts');
const flush = () => new Promise((resolve) => setImmediate(resolve));
const grounding = ATTENTION_SCRIPTS['54321'][0].steps;
const muscle = ATTENTION_SCRIPTS['muscle-release'][0].steps;

// Run both real hooks and the playback controller. Only native APIs and React's
// render/effect scheduling are replaced, matching the existing audio hook tests.
function mount({ loaded = true } = {}) {
  const slots = [];
  const players = new Map();
  const ready = new Set();
  const listeners = new Set();
  const calls = [];
  const preferences = { soundEffects: true };
  let cursor = 0;
  let effects = [];
  let focused = true;
  let allLoaded = loaded;
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
      if (!previous || !deps.every((dep, i) => Object.is(dep, previous.deps[i]))) {
        slots[index] = { deps, value: factory() };
      }
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return;
      slots[index] = { deps };
      effects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  const soundExports = {};
  vm.runInNewContext(compiledSound, {
    exports: soundExports,
    __DEV__: false,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native') return { AppState: appState };
      if (name === '@react-navigation/native') return { useIsFocused: () => focused };
      if (name === 'expo-audio') return {
        setAudioModeAsync: async () => {},
        useAudioPlayer(source) {
          const kind = source.split('/').at(-1).replace('.wav', '');
          if (!players.has(kind)) players.set(kind, {
            kind,
            volume: 0,
            pause() { calls.push({ kind, action: 'pause' }); },
            async seekTo() {},
            play() { calls.push({ kind, action: 'play' }); },
          });
          return players.get(kind);
        },
      };
      if (name.endsWith('/audioSettings/preferences')) return { getAudioPreferences: () => preferences };
      if (name.endsWith('/useAudioPreferences')) return { useAudioPreferences: () => ({ preferences, loaded: true }) };
      if (name.endsWith('/completionSoundPlayback')) return { createCompletionSoundPlayback };
      if (name.endsWith('/nativeCompletionSoundPlayback')) return {};
      if (name.endsWith('/completionAudio')) return { completionAudioNative: null };
      if (name === './useAudioLoaded') return { useAudioLoaded: (player) => allLoaded || ready.has(player.kind) };
      if (name.endsWith('.wav')) return name;
      throw new Error(`Unexpected sound dependency: ${name}`);
    },
  });
  const cueExports = {};
  vm.runInNewContext(compiledCues, {
    exports: cueExports,
    require(name) {
      if (name === 'react') return react;
      if (name.endsWith('/useCompletionSound')) return soundExports;
      if (name.endsWith('/attentionCues')) return { attentionCueFor };
      throw new Error(`Unexpected cue dependency: ${name}`);
    },
  });
  return {
    calls,
    listeners,
    render(key, step, active = true) {
      cursor = 0;
      effects = [];
      cueExports.useAttentionCueSounds(key, step, active);
      effects.forEach((run) => run());
    },
    played() { return calls.filter(({ action }) => action === 'play').map(({ kind }) => kind); },
    setFocused(value) { focused = value; },
    setEnabled(value) { preferences.soundEffects = value; },
    load(kind) { ready.add(kind); },
    loadAll() { allLoaded = true; },
    setAppState(value) {
      appState.currentState = value;
      for (const listener of [...listeners]) listener(value);
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

test('each sense starts one note, with silent intro, closing, and ordinary rerenders', async () => {
  const hook = mount();
  for (let index = 0; index < grounding.length; index++) {
    hook.render(index, grounding[index]);
    await flush();
    hook.render(index, { ...grounding[index] });
    await flush();
  }
  assert.deepEqual(hook.played(), [5, 4, 3, 2, 1].map((count) => `attention-sense-${count}`));
  hook.render(grounding.length, null);
  await flush();
  assert.equal(hook.played().length, 5);
});

test('every muscle squeeze and release plays once across ten complete sessions', async () => {
  for (let session = 0; session < 10; session++) {
    const hook = mount();
    for (let index = 0; index < muscle.length; index++) {
      hook.render(index, muscle[index]);
      await flush();
    }
    assert.deepEqual(hook.played(), Array.from({ length: 5 }, () => ['attention-squeeze', 'attention-release']).flat());
    assert.equal(hook.listeners.size, 7);
    hook.unmount();
    assert.equal(hook.listeners.size, 0);
  }
});

test('mounting mid-step and toggling active does not replay it', async () => {
  const hook = mount();
  hook.render(1, muscle[1]);
  await flush();
  hook.render(1, muscle[1], false);
  hook.render(1, muscle[1], true);
  await flush();
  assert.deepEqual(hook.played(), []);
  hook.render(2, muscle[2]);
  await flush();
  assert.deepEqual(hook.played(), ['attention-release']);
});

test('steps reached while inactive are silent on reactivation', async () => {
  const hook = mount();
  hook.render(0, grounding[0]);
  hook.render(1, grounding[1], false);
  hook.render(1, grounding[1], true);
  await flush();
  assert.deepEqual(hook.played(), []);
  hook.render(2, grounding[2]);
  await flush();
  assert.deepEqual(hook.played(), ['attention-sense-4']);
});

test('a cue that loads after its step exits cannot play over the next step', async () => {
  const hook = mount({ loaded: false });
  hook.render(0, muscle[0]);
  hook.render(1, muscle[1]);
  hook.render(2, muscle[2]);
  hook.load('attention-squeeze');
  hook.render(2, muscle[2]);
  await flush();
  assert.deepEqual(hook.played(), []);
  hook.load('attention-release');
  hook.render(2, muscle[2]);
  await flush();
  assert.deepEqual(hook.played(), ['attention-release']);
});

test('closing cancels pending sense notes and stops an already playing cue', async () => {
  const hook = mount({ loaded: false });
  hook.render(0, grounding[0]);
  hook.render(1, grounding[1]);
  hook.render(2, grounding[2]);
  hook.load('attention-sense-4');
  hook.render(2, grounding[2]);
  await flush();
  assert.deepEqual(hook.played(), ['attention-sense-4']);
  hook.render(6, grounding[6]);
  assert.ok(hook.calls.some(({ kind, action }) => kind === 'attention-sense-4' && action === 'pause'));
  hook.loadAll();
  hook.render(6, grounding[6]);
  await flush();
  assert.deepEqual(hook.played(), ['attention-sense-4']);
});

for (const condition of ['blur', 'background', 'inactive', 'muted']) {
  test(`${condition} blocks new cues and returning does not replay the current step`, async () => {
    const hook = mount();
    hook.render(0, grounding[0]);
    if (condition === 'blur') hook.setFocused(false);
    else if (condition === 'muted') hook.setEnabled(false);
    else hook.setAppState(condition);
    hook.render(1, grounding[1]);
    await flush();
    assert.deepEqual(hook.played(), []);
    hook.setFocused(true);
    hook.setEnabled(true);
    hook.setAppState('active');
    hook.render(1, grounding[1]);
    await flush();
    assert.deepEqual(hook.played(), []);
    hook.render(2, grounding[2]);
    await flush();
    assert.deepEqual(hook.played(), ['attention-sense-4']);
  });
}

test('unmount cancels a pending cue and removes every app-state subscription', async () => {
  const hook = mount({ loaded: false });
  hook.render(0, grounding[0]);
  hook.render(1, grounding[1]);
  hook.unmount();
  await flush();
  assert.deepEqual(hook.played(), []);
  assert.equal(hook.listeners.size, 0);
});
