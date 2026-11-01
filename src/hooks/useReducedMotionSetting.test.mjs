import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useReducedMotionSetting.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

function load() {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react-native-reanimated') return { ReduceMotion: { Never: 'never', System: 'system' } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test('every animation plays in full whatever the system setting', () => {
  const motion = load();
  assert.equal(motion.useReducedMotionSetting(), false);
  assert.equal(motion.useAnimationReduceMotion(), 'never');
});

test('FullMotion renders its children unchanged', () => {
  assert.equal(load().FullMotion({ children: 'preview' }), 'preview');
});

test('the app sets the same policy for Reanimated defaults', () => {
  const app = readFileSync(new URL('../../App.tsx', import.meta.url), 'utf8');
  assert.match(app, /<ReducedMotionConfig mode=\{ReduceMotion\.Never\} \/>/);
});
