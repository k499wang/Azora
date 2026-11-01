import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useReducedMotionSetting.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

function setup(system) {
  const exports = {};
  const values = new Map();
  const modes = { Never: 'never', System: 'system' };
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return {
        createContext(defaultValue) {
          const context = { defaultValue };
          context.Provider = context;
          return context;
        },
        useContext: context => values.get(context) ?? context.defaultValue,
      };
      if (name === 'react/jsx-runtime') return {
        jsx: (type, props) => ({ type, props }),
      };
      if (name === 'react-native-reanimated') return {
        ReduceMotion: modes,
        useReducedMotion: () => system,
        ReducedMotionConfig() { throw new Error('A scoped boundary must not change global motion'); },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const read = () => ({
    reduced: exports.useReducedMotionSetting(),
    animation: exports.useAnimationReduceMotion(),
  });
  return {
    read,
    inside(callback = read) {
      const { type, props } = exports.FullMotion({ children: 'preview' });
      assert.equal(props.children, 'preview');
      const previous = values.get(type);
      values.set(type, props.value);
      try { return callback(); }
      finally {
        if (previous === undefined) values.delete(type);
        else values.set(type, previous);
      }
    },
  };
}

test('onboarding has full motion on its first render with either system preference', () => {
  for (const system of [false, true]) {
    const harness = setup(system);
    assert.deepEqual(harness.inside(), { reduced: false, animation: 'never' });
  }
});

test('outside callers keep system motion before and after onboarding', () => {
  for (const system of [false, true]) {
    const harness = setup(system);
    const expected = { reduced: system, animation: 'system' };
    assert.deepEqual(harness.read(), expected);
    harness.inside();
    assert.deepEqual(harness.read(), expected);
  }
});

test('nested paywall previews keep their enclosing full-motion policy', () => {
  const harness = setup(true);
  harness.inside(() => {
    assert.deepEqual(harness.inside(), { reduced: false, animation: 'never' });
    assert.deepEqual(harness.read(), { reduced: false, animation: 'never' });
  });
  assert.deepEqual(harness.read(), { reduced: true, animation: 'system' });
});
