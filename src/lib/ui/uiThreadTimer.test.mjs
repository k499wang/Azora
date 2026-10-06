import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./uiThreadTimer.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source.replace(/import[\s\S]*?from 'react-native-reanimated';/, ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function setup() {
  let finish;
  let calls = 0;
  const queued = [];
  let delayMotion;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    makeMutable: () => ({ value: 0 }),
    ReduceMotion: { Never: 'never' },
    withDelay: (_ms, animation, reduceMotion) => { delayMotion = reduceMotion; return animation; },
    withTiming: (_value, _options, callback) => { finish = callback; return 1; },
    runOnJS: (callback) => () => queued.push(callback),
    cancelAnimation() {},
  });
  const cancel = exports.startUiTimer(100, () => { calls += 1; });
  return { cancel, delayMotion, finish: (finished = true) => finish(finished), flush: () => queued.splice(0).forEach((callback) => callback()), calls: () => calls };
}

test('elapsed-time delay is preserved when accessibility reduces visual motion', () => {
  assert.equal(setup().delayMotion, 'never');
});

test('a completed UI timer delivers its callback on JS', () => {
  const timer = setup();
  timer.finish();
  assert.equal(timer.calls(), 0);
  timer.flush();
  assert.equal(timer.calls(), 1);
});

test('cancellation suppresses a UI completion already queued on JS', () => {
  const timer = setup();
  timer.finish();
  timer.cancel();
  timer.flush();
  assert.equal(timer.calls(), 0);
});

test('cancellation suppresses a late completion and unfinished animations', () => {
  const timer = setup();
  timer.cancel();
  timer.finish();
  timer.finish(false);
  timer.flush();
  assert.equal(timer.calls(), 0);
});
