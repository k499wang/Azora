import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import { colors } from '../../../theme/colors.ts';
import { spacing } from '../../../theme/spacing.ts';
import { routineStepClock } from '../domain/routinePlayer.ts';

function loadTaskTimer() {
  const modules = {
    'react/jsx-runtime': jsxRuntime,
    'react': {},
    'react-native': {
      View: 'View', Pressable: 'Pressable',
      StyleSheet: { create: (styles) => styles },
      useWindowDimensions: () => ({ width: 390 }),
    },
    'react-native-reanimated': {
      default: { View: 'Animated.View' },
      useReducedMotion: () => false,
      useSharedValue: (value) => ({ value }),
      useAnimatedStyle: (callback) => callback(),
    },
    '@shopify/react-native-skia': {},
    'Text': { Text: 'Text' },
    'Icon': { default: 'Icon' },
    'TaskIllustration': { default: 'TaskIllustration' },
    'LipToken': { default: 'LipToken' },
    'useWhileVisible': { useWhileVisible() {} },
    'tapHaptics': {},
    'card': { radius: { full: 999 } },
    'colors': { colors },
    'spacing': { spacing },
    'motion': {},
    'typography': { fonts: {}, typography: { title: {}, body: {} } },
    'routinePlayer': { routineStepClock },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    readFileSync(new URL('./TaskTimer.tsx', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText, {
    exports,
    require(name) {
      const key = Object.keys(modules).find((key) => name === key || name.endsWith(`/${key}`));
      if (!key) throw new Error(`Unexpected import: ${name}`);
      return modules[key];
    },
  });
  return exports.default;
}

function checkSiblingKeys(element) {
  if (element == null || typeof element !== 'object') return;
  const children = [element.props?.children].flat(Infinity).filter((child) => child != null);
  const keys = children.filter((child) => typeof child === 'object' && child.key != null).map((child) => child.key);
  assert.equal(new Set(keys).size, keys.length, `Duplicate sibling keys: ${keys.join(', ')}`);
  children.forEach(checkSiblingKeys);
}

const TaskTimer = loadTaskTimer();
for (const stepKey of ['focus', '0:goal-1', '1:goal-2']) {
  test(`timer sibling keys stay unique for ${stepKey}`, () => {
    checkSiblingKeys(TaskTimer({
      title: 'Focus Timer', icon: 'timer', stepKey, minutes: 25, paused: true,
      timer: { seconds: 1500, fill: 1, progress: { value: 0 } },
      onTogglePause() {}, onLess() {}, onMore() {}, onDone() {},
    }));
  });
}
