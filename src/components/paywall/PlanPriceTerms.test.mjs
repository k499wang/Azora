import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as prices from '../../lib/paywall/planPrice.ts';
import { trialDaysFromLabel } from '../../lib/paywall/trialReminder.ts';

const jsx = (type, props) => ({ type, props });
const dependencies = {
  'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
  'react-native': { StyleSheet: { create: value => value } },
  '../../lib/paywall/planPrice': prices,
  '../../lib/paywall/trialReminder': { trialDaysFromLabel },
  '../../theme/colors': { colors: { text: {} } },
  '../../theme/typography': { fonts: {}, typography: { body: {} } },
  '../common/Text': { Text: 'Text' },
};
const exports = {};
const code = ts.transpileModule(readFileSync(new URL('./PlanPriceTerms.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(code, { exports, require: name => {
  assert.ok(name in dependencies, `Unexpected import: ${name}`);
  return dependencies[name];
} });
const text = node => Array.isArray(node)
  ? node.map(text).join('')
  : node == null || typeof node === 'boolean' ? ''
    : typeof node === 'object' ? text(node.props.children) : String(node);
const summary = overrides => text(exports.PlanPriceTerms({ pkg: {
  priceString: '$60.00', priceCents: 6000, billingPeriod: 'year',
  trialLabel: null, introOffer: null, ...overrides,
} }));

test('annual summaries use the fixed 120 reference and matching savings while retaining the real charge', () => {
  assert.equal(summary({}), '$120.00 $60.00 per year ($5.00/mo) Save 50%.');
  assert.equal(summary({ priceString: '$30.00', priceCents: 3000 }), '$120.00 $30.00 per year ($2.50/mo) Save 75%.');
  assert.equal(summary({ introOffer: { days: 30, priceString: '$5.99' } }), 'Redeem 30 days for $5.99, then $120.00 $60.00 per year ($5.00/mo) Save 50%.');
  assert.equal(summary({ priceString: '$150.00', priceCents: 15000 }), '$150.00 per year ($12.50/mo).');
});

test('paid monthly summaries retain the intro and recurring store prices without an annual comparison', () => {
  assert.equal(summary({
    billingPeriod: 'month', priceString: '$9.99', priceCents: 999,
    introOffer: { days: 30, priceString: '$5.99' },
  }), 'Redeem 30 days for $5.99, then $9.99 per month. Cancel anytime.');
});
