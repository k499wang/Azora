import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function harness() {
  const taps = [], presses = [];
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { ActivityIndicator: 'Spinner', Pressable: 'Pressable', View: 'View', StyleSheet: { create: value => value } },
    './Text': { Text: 'Text' },
    '../../theme/card': { radius: { card: 22 } },
    '../../theme/colors': { colors: { primary: {}, text: {}, playful: { amber: {}, violet: {} }, background: {}, error: {} } },
    '../../theme/spacing': { spacing: {} },
    '../../theme/typography': { fonts: {}, typography: { button: {} } },
    '../../native/tapHaptics': { triggerTapHaptic: () => taps.push('tap'), triggerMediumHaptic: () => taps.push('medium') },
  };
  const compiled = ts.transpileModule(readFileSync(new URL('./ChunkyButton.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => dependencies[name] });
  return { taps, presses, render: props => exports.default({ label: '3 days before', onPress: () => presses.push(true), ...props }) };
}

test('radio choice exposes selection and fires tap feedback once with its action', () => {
  const h = harness();
  const button = h.render({ accessibilityRole: 'radio', accessibilityLabel: '3 days before, Oct 22', selected: true, haptic: 'tap' });
  assert.equal(button.props.accessibilityRole, 'radio');
  assert.equal(button.props.accessibilityLabel, '3 days before, Oct 22');
  assert.equal(button.props.accessibilityState.selected, true);
  button.props.onPress();
  assert.deepEqual(h.taps, ['tap']);
  assert.equal(h.presses.length, 1);
});

test('disabled or loading choices suppress their action and haptic', () => {
  for (const props of [{ disabled: true }, { loading: true }]) {
    const h = harness();
    const button = h.render({ ...props, haptic: 'tap' });
    assert.equal(button.props.accessibilityState.disabled, true);
    button.props.onPress();
    assert.deepEqual(h.taps, []);
    assert.deepEqual(h.presses, []);
  }
});
