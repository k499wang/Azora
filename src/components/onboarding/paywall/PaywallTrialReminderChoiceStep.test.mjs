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

test('one possible reminder is promised with no choices, and turns honest when notifications are off', () => {
  const { PaywallTrialReminderChoiceStep } = load('./PaywallTrialReminderChoiceStep.tsx', {
    ...dependencies,
    '../../common/Text': { Text: 'Text' },
    './paywallStepStyles': { paywallStepStyles: {} },
    '../../../native/tapHaptics': { triggerTapHaptic() {} },
    '../../paywall/PaywallChoiceCard': { PaywallChoiceCard: 'Choice' },
    './TrialReminderBell': { TrialReminderBell: 'Bell' },
    '../../../lib/paywall/trialReminder': {
      availableTrialReminderDays: () => [2],
      formatTrialDate: () => 'October 26',
      trialTimelineDates: () => ({ reminder: new Date() }),
    },
  });
  const reminder = { enabled: false, daysBeforeEnd: 2, selectedDaysBeforeEnd: null, busy: false, unavailable: false };
  const promised = PaywallTrialReminderChoiceStep({ trialDays: 3, reminder });
  assert.equal(nodes(promised, 'Choice').length, 0);
  assert.equal(nodes(promised, 'Text')[0].props.children, 'We’ll remind you 2 days before your trial ends');
  const denied = PaywallTrialReminderChoiceStep({ trialDays: 3, reminder: { ...reminder, denied: true } });
  assert.equal(nodes(denied, 'Text')[0].props.children, 'Turn on notifications and we’ll remind you 2 days before your trial ends');
  const paid = PaywallTrialReminderChoiceStep({ trialDays: 3, reminder, paidTrial: true });
  assert.equal(nodes(paid, 'Choice').length, 1);
  assert.equal(nodes(paid, 'Text')[0].props.children, 'When should we remind you before your trial ends?');
});

test('a choice that only fits the longer trial is offered and labelled', () => {
  const { PaywallTrialReminderChoiceStep } = load('./PaywallTrialReminderChoiceStep.tsx', {
    ...dependencies,
    '../../common/Text': { Text: 'Text' },
    './paywallStepStyles': { paywallStepStyles: {} },
    '../../../native/tapHaptics': { triggerTapHaptic() {} },
    '../../paywall/PaywallChoiceCard': { PaywallChoiceCard: 'Choice' },
    './TrialReminderBell': { TrialReminderBell: 'Bell' },
    '../../../lib/paywall/trialReminder': {
      availableTrialReminderDays: days => [2, 3].filter(offset => offset < days),
      formatTrialDate: () => 'Nov 8',
      trialTimelineDates: () => ({ reminder: new Date() }),
    },
  });
  const reminder = { enabled: false, daysBeforeEnd: 2, selectedDaysBeforeEnd: null, busy: false, unavailable: false };
  const cards = nodes(PaywallTrialReminderChoiceStep({ trialDays: 3, choiceTrialDays: 30, longestPlanTitle: 'Monthly', reminder, paidTrial: true }), 'Choice');
  assert.deepEqual(cards.map(card => `${card.props.title}: ${card.props.detail}`), ['2 days before: Nov 8', '3 days before: Monthly plan only']);
});
