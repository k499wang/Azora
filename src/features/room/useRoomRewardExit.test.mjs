import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(
  readFileSync(new URL('./useRoomRewardExit.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup(reducedMotion = false) {
  const exports = {};
  const progress = { value: 0 };
  let animation;
  let cleanup;
  let done = 0;
  let leaving = false;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        useCallback: (fn) => fn,
        useEffect: (fn) => { cleanup = fn(); },
        useRef: (current) => ({ current }),
        useState: () => [false, (value) => { leaving = value; }],
      };
      if (name === 'react-native-reanimated') return {
        useReducedMotion: () => reducedMotion,
        useSharedValue: () => progress,
        useAnimatedStyle: (fn) => fn,
        withTiming: (value, config, finish) => {
          animation = { value, config, finish };
          return 0;
        },
        runOnJS: (fn) => fn,
        cancelAnimation: () => animation?.finish(false),
      };
      if (name.endsWith('/motion')) return { easing: { enter: 'cubic-out' } };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const hook = exports.useRoomRewardExit(() => { done += 1; });
  return { hook, progress, cleanup: () => cleanup(), get done() { return done; },
    get leaving() { return leaving; }, get animation() { return animation; } };
}

test('reward dismissal fades in place and closes only after the fade completes', () => {
  const state = setup();
  state.hook.dismiss();
  assert.equal(state.leaving, true);
  assert.equal(state.animation.config.duration, 300);
  assert.equal(state.animation.config.easing, 'cubic-out');
  assert.equal(state.done, 0);
  state.progress.value = 0.5;
  assert.equal(state.hook.exitStyle().opacity, 0.5);
  assert.equal(state.hook.exitStyle().transform, undefined);
  state.animation.finish(true);
  assert.equal(state.done, 1);
  state.hook.dismiss();
  assert.equal(state.done, 1);
});

test('unmount cancels the fade without closing its owner', () => {
  const state = setup();
  state.hook.dismiss();
  state.cleanup();
  assert.equal(state.done, 0);
});

test('reduced motion closes immediately and repeated dismissal is ignored', () => {
  const state = setup(true);
  state.hook.dismiss();
  state.hook.dismiss();
  assert.equal(state.done, 1);
  assert.equal(state.leaving, true);
  assert.equal(state.animation, undefined);
});
