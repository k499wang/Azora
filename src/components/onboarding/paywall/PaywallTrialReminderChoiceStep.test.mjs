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
  'react-native': { Pressable: 'Pressable', View: 'View' },
};

function nodes(tree, type) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, type));
  return [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
}

test('reminder choices stay interactive while an earlier choice saves', () => {
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
  const selections = [];
  const reminder = {
    enabled: false, daysBeforeEnd: 2, selectedDaysBeforeEnd: 3, busy: true, unavailable: false,
    chooseDaysBeforeEnd: async days => { selections.push(days); },
  };
  const choices = nodes(PaywallTrialReminderChoiceStep({ trialDays: 7, reminder }), 'Choice');
  assert.deepEqual(choices.map(choice => choice.props.selected), [false, true]);
  for (const choice of choices) {
    assert.equal(choice.props.disabled, false);
    assert.equal(choice.props.busy, undefined);
    choice.props.onPress();
  }
  assert.deepEqual(selections, [2, 3]);
  const unavailable = nodes(PaywallTrialReminderChoiceStep({ trialDays: 7, reminder, disabled: true }), 'Choice');
  assert.ok(unavailable.every(choice => choice.props.disabled));
});
