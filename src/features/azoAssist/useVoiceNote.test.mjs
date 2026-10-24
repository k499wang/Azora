import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useVoiceNote.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const flush = () => new Promise((resolve) => setImmediate(resolve));

function mount({ permission = async () => ({ granted: true }) } = {}) {
  const slots = [];
  const events = new Map();
  const calls = [];
  const texts = [];
  let cursor = 0;
  let effects = [];
  let unmounted = false;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => {
        assert.equal(unmounted, false, 'no state updates after unmount');
        slots[index] = value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !deps.every((dep, i) => dep === previous.deps[i])) {
        slots[index] = { deps, callback };
      }
      return slots[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((dep, i) => dep === previous.deps[i])) return;
      slots[index] = { deps };
      effects.push(() => { slots[index].cleanup = effect(); });
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native') return {
        Alert: { alert: () => calls.push('alert') },
        Linking: { openSettings: async () => {} },
      };
      if (name === 'expo-speech-recognition') return {
        useSpeechRecognitionEvent: (event, callback) => events.set(event, callback),
        ExpoSpeechRecognitionModule: {
          requestPermissionsAsync() { calls.push('permission'); return permission(); },
          start() { calls.push('start'); },
          stop() { calls.push('stop'); },
          abort() {
            calls.push('abort');
            events.get('end')();
          },
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    calls,
    texts,
    render() {
      cursor = 0;
      effects = [];
      const voice = exports.useVoiceNote({ onText: (text) => texts.push(text) });
      effects.forEach((run) => run());
      return voice;
    },
    emit(event, payload) { events.get(event)(payload); },
    unmount() {
      unmounted = true;
      slots.forEach((slot) => slot?.cleanup?.());
    },
  };
}

for (const stopping of [false, true]) {
  test(`cancel drops ${stopping ? 'transcribing' : 'recording'} notes and ignores late native events`, async () => {
    const hook = mount();
    const cancel = hook.render().cancel;
    hook.render().toggle();
    await flush();
    hook.emit('result', { results: [{ transcript: 'private thoughts' }], isFinal: false });
    hook.emit('volumechange', { value: 8 });
    if (stopping) hook.render().toggle();
    assert.equal(hook.render().phase, stopping ? 'transcribing' : 'recording');
    cancel();
    hook.emit('result', { results: [{ transcript: 'unrelated speech' }], isFinal: true });
    hook.emit('error', { error: 'no-speech' });
    hook.emit('end');
    const voice = hook.render();
    assert.equal(voice.cancel, cancel);
    assert.equal(voice.phase, 'idle');
    assert.equal(voice.transcript, '');
    assert.equal(voice.error, null);
    assert.equal(voice.durationMillis, 0);
    assert.equal(voice.metering, -60);
    assert.deepEqual(hook.texts, []);
    assert.equal(hook.calls.filter((call) => call === 'abort').length, 1);
  });
}

for (const granted of [false, true]) {
  test(`cancel invalidates pending permission ${granted ? 'approval' : 'denial'} without starting or alerting`, async () => {
    let resolvePermission;
    const hook = mount({ permission: () => new Promise((resolve) => { resolvePermission = resolve; }) });
    const voice = hook.render();
    voice.toggle();
    voice.toggle();
    assert.equal(hook.calls.filter((call) => call === 'permission').length, 1);
    voice.cancel();
    resolvePermission({ granted });
    await flush();
    assert.equal(hook.render().phase, 'idle');
    assert.equal(hook.calls.includes('start'), false);
    assert.equal(hook.calls.includes('alert'), false);
  });
}

test('unmount invalidates pending permission without state updates or starting', async () => {
  let resolvePermission;
  const hook = mount({ permission: () => new Promise((resolve) => { resolvePermission = resolve; }) });
  hook.render().toggle();
  hook.unmount();
  resolvePermission({ granted: true });
  await flush();
  assert.equal(hook.calls.includes('start'), false);
});

test('unmount aborts a recording and cannot submit its final text', async () => {
  const hook = mount();
  hook.render().toggle();
  await flush();
  hook.emit('result', { results: [{ transcript: 'unfinished' }], isFinal: true });
  hook.unmount();
  hook.emit('result', { results: [{ transcript: 'late' }], isFinal: true });
  hook.emit('error', { error: 'no-speech' });
  hook.emit('end');
  assert.deepEqual(hook.texts, []);
  assert.equal(hook.calls.includes('abort'), true);
});

test('normal completion submits once, and repeated cancellation permits fresh notes', async () => {
  const hook = mount();
  for (let cycle = 0; cycle < 5; cycle++) {
    hook.render().toggle();
    await flush();
    hook.emit('result', { results: [{ transcript: 'discard me' }], isFinal: true });
    hook.render().cancel();
    hook.render().toggle();
    await flush();
    hook.emit('result', { results: [{ transcript: 'buy milk' }], isFinal: true });
    hook.render().toggle();
    assert.equal(hook.render().phase, 'transcribing');
    hook.emit('result', { results: [{ transcript: 'and bread' }], isFinal: true });
    hook.emit('end');
    hook.emit('end');
    assert.equal(hook.render().phase, 'idle');
  }
  assert.deepEqual(hook.texts, Array(5).fill('buy milk and bread'));
  assert.equal(hook.calls.filter((call) => call === 'abort').length, 5);
  assert.equal(hook.calls.filter((call) => call === 'stop').length, 5);
});
