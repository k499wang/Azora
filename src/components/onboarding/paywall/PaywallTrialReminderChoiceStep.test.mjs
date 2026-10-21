import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, dependencies) {
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const jsx = (type, props) => ({ type, props });
const dependencies = {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { Pressable: 'Pressable', View: 'View', StyleSheet: { create: styles => styles } },
};

function nodes(tree, type) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, type));
  return [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
}

test('pending reminder choices keep the immediate selection visible without disabled fading', () => {
  const { PaywallTrialReminderChoiceStep } = load('./PaywallTrialReminderChoiceStep.tsx', {
    ...dependencies,
    '../../common/Text': { Text: 'Text' },
    './paywallStepStyles': { paywallStepStyles: {} },
    '../../../native/tapHaptics': { triggerTapHaptic() {} },
    '../../paywall/PaywallChoiceCard': { PaywallChoiceCard: 'Choice' },
    './TrialReminderBell': { TrialReminderBell: 'Bell' },
    '../../../lib/paywall/trialReminder': {
      availableTrialReminderDays: () => [2, 3],
      formatTrialDate: () => 'October 26',
      trialTimelineDates: () => ({ reminder: new Date() }),
    },
  });
  const reminder = { enabled: false, daysBeforeEnd: 2, selectedDaysBeforeEnd: 3, busy: true, unavailable: false };
  const choices = nodes(PaywallTrialReminderChoiceStep({ trialDays: 7, reminder }), 'Choice');
  assert.deepEqual(choices.map(choice => choice.props.selected), [false, true]);
  for (const choice of choices) {
    assert.equal(choice.props.disabled, false);
    assert.equal(choice.props.busy, true);
  }
  const unavailable = nodes(PaywallTrialReminderChoiceStep({ trialDays: 7, reminder, disabled: true }), 'Choice');
  assert.ok(unavailable.every(choice => choice.props.disabled));
});

test('busy choice cards block duplicate taps without dimming the selected border', () => {
  const { PaywallChoiceCard } = load('../../paywall/PaywallChoiceCard.tsx', {
    ...dependencies,
    '../common/Text': { Text: 'Text' },
    '../../theme/card': { card: { base: {}, shadow: {} } },
    '../../theme/colors': { colors: { background: {}, neutral: {}, primary: { blue500: 'blue' }, text: {} } },
    '../../theme/spacing': { spacing: {} },
    '../../theme/typography': { fonts: {}, typography: { heading: { heading1: {} }, caption: { caption1: {} } } },
  });
  const card = PaywallChoiceCard({ title: '3 days before', detail: 'October 26', selected: true, busy: true, onPress() {} });
  assert.equal(card.props.disabled, true);
  assert.equal(card.props.accessibilityState.busy, true);
  assert.equal(card.props.accessibilityState.selected, true);
  const styles = card.props.style({ pressed: false }).filter(Boolean);
  assert.ok(styles.some(style => style.borderColor === 'blue'));
  assert.ok(styles.every(style => style.opacity == null));
});
