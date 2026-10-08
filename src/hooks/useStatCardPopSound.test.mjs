import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useStatCardPopSound.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function mount({ nativeScheduling = true } = {}) {
  let now = 1000;
  let previous = -1;
  let reaction;
  let fallbackCalls = 0;
  const deadlines = [];
  const queued = [];
  const cleanups = [];
  const sound = Object.assign(() => true, {
    scheduleAt(deadline) { deadlines.push(deadline); return nativeScheduling; },
    playIfReady() { fallbackCalls += 1; return true; },
  });
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    Date: { now: () => now },
    require(name) {
      if (name === 'react') return {
        useCallback: (callback) => callback,
        useRef: (current) => ({ current }),
        useEffect: (effect) => { cleanups.push(effect()); },
      };
      if (name === 'react-native-reanimated') return {
        runOnJS: (callback) => (...args) => queued.push(() => callback(...args)),
        useAnimatedReaction: (_prepare, react) => { reaction = react; },
      };
      if (name === './useCompletionSound') return { useCompletionSound: () => sound };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  exports.useStatCardPopSound({ value: -1 }, 400);
  return {
    deadlines,
    get fallbackCalls() { return fallbackCalls; },
    frame(ms, timestamp = now) {
      now = timestamp;
      reaction(ms, previous);
      previous = ms;
    },
    flush(timestamp = now) {
      now = timestamp;
      queued.splice(0).forEach((callback) => callback());
    },
    unmount() { cleanups.forEach((cleanup) => cleanup?.()); },
  };
}

test('native cue retains the animation deadline across JS delivery delay and plays only once', () => {
  const hook = mount();
  hook.frame(215, 1000);
  hook.flush(1070);
  assert.deepEqual(hook.deadlines, [1185]);
  hook.frame(400, 1185);
  hook.flush(1200);
  hook.frame(420, 1205);
  hook.flush();
  assert.equal(hook.fallbackCalls, 0);
  assert.equal(hook.deadlines.length, 1);
});

test('different frame sampling and JS delays preserve the 520ms spacing between cards', () => {
  const first = mount();
  const second = mount();
  first.frame(205, 1000);
  first.flush(1070);
  second.frame(211, 1526);
  second.flush(1580);
  assert.equal(second.deadlines[0] - first.deadlines[0], 520);
});

test('without native scheduling the fallback follows the actual tab crossing', () => {
  const hook = mount({ nativeScheduling: false });
  hook.frame(215, 1000);
  hook.flush();
  assert.equal(hook.fallbackCalls, 0);
  hook.frame(395, 1180);
  hook.flush();
  assert.equal(hook.fallbackCalls, 0);
  hook.frame(410, 1195);
  hook.flush(1200);
  hook.frame(430, 1215);
  hook.flush();
  assert.equal(hook.fallbackCalls, 1);
});

test('a stalled JS callback skips a stale fallback instead of sounding after expansion', () => {
  const hook = mount({ nativeScheduling: false });
  hook.frame(410, 1000);
  hook.flush(1100);
  assert.equal(hook.fallbackCalls, 0);
});

test('queued UI callbacks cannot schedule or play after their card unmounts', () => {
  const hook = mount({ nativeScheduling: false });
  hook.frame(400, 1000);
  hook.unmount();
  hook.flush();
  assert.deepEqual(hook.deadlines, []);
  assert.equal(hook.fallbackCalls, 0);
});
