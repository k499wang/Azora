import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
let settledOpacity = 1;
const compiled = ts.transpileModule(readFileSync(new URL('./CelebrationToast.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(compiled, {
  exports,
  require(name) {
    if (name === 'react') return { memo: (component) => component, useEffect() {} };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === 'react-native') return { View: 'View', StyleSheet: { create: (styles) => styles } };
    if (name === 'react-native-reanimated') return {
      default: { View: 'AnimatedView' },
      useSharedValue: () => ({ value: settledOpacity }),
      useAnimatedStyle: (compute) => compute(),
      useReducedMotion: () => false,
    };
    if (name.endsWith('/colors')) return { colors: { toast: {} } };
    if (name.endsWith('/card')) return { radius: {} };
    if (name.endsWith('/spacing')) return { spacing: {} };
    if (name.endsWith('/typography')) return { fonts: {}, typography: { title: {}, body: {} } };
    if (name.endsWith('/motion')) return {};
    return {};
  },
});

test('hidden toast removes its native bar even if animated opacity is still visible', () => {
  const toast = exports.default;
  settledOpacity = 1;
  assert.equal(toast({ title: 'Nice work!', detail: 'Drink water', visible: false }), null);
  assert.equal(toast({ title: 'Nice work!', detail: 'Drink water', visible: true }).type, 'AnimatedView');
  assert.equal(toast({ title: 'Nice work!', detail: 'Drink water', visible: false }), null);
});
