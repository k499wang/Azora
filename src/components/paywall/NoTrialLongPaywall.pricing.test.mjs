import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { computePerMonth } from '../../lib/paywall/planPrice.ts';
import { trialDaysFromLabel } from '../../lib/paywall/trialReminder.ts';

const source = readFileSync(new URL('./NoTrialLongPaywall.tsx', import.meta.url), 'utf8');
const component = source.slice(source.indexOf('function PlanOption('), source.indexOf('const styles ='));
const code = ts.transpileModule(`export ${component}`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
const jsx = (type, props) => ({ type, props });
vm.runInNewContext(code, {
  exports, computePerMonth, trialDaysFromLabel,
  Text: 'Text', Pressable: 'Pressable', View: 'View',
  styles: new Proxy({}, { get: (_, key) => key }),
  require: () => ({ jsx, jsxs: jsx }),
});
const text = node => Array.isArray(node) ? node.map(text).join('')
  : node == null || typeof node === 'boolean' ? ''
    : typeof node === 'object' ? text(node.props.children) : String(node);
const find = (node, style) => {
  if (node == null || typeof node !== 'object') return undefined;
  if (node.props?.style === style) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const found = find(child, style);
    if (found) return found;
  }
};
const base = { id: 'annual', title: 'Annual', priceString: '$59.99', priceCents: 5999, billingPeriod: 'year', trialLabel: null, trialDays: null, introOffer: null };

test('long-page cards keep the full recurring charge for free and paid trials', () => {
  for (const [patch, title, intro, charge] of [
    [{ trialLabel: '7-day free trial', trialDays: 7 }, '7-day trial', 'Free', '$59.99/year'],
    [{ introOffer: { days: 30, priceString: '$5.99' } }, '30-day trial', '$5.99', '$59.99/year'],
    [{ id: 'monthly', title: 'Weekly', billingPeriod: 'week', priceString: '$9.99', priceCents: 999, introOffer: { days: 7, priceString: '$0.99' } }, '7-day trial', '$0.99', '$9.99/week'],
    [{}, 'Annual', null, '$59.99/year'],
  ]) {
    const pkg = { ...base, ...patch };
    const selected = [];
    const card = exports.PlanOption({ pkg, isSelected: true, savingsPercent: null, disabled: false, onSelect: id => selected.push(id) });
    assert.equal(text(find(card, 'planTitle')), title);
    assert.equal(find(card, 'planDetail') == null ? null : text(find(card, 'planDetail')), intro);
    assert.equal(text(find(card, 'planPrice')), charge);
    card.props.onPress();
    assert.deepEqual(selected, [pkg.id]);
  }
});
