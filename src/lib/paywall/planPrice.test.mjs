import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnnualSavings,
  computePerWeek,
  formatCurrencyLike,
  packagePriceCents,
  parsePriceNumber,
} from './planPrice.ts';

test('parsePriceNumber reads both decimal conventions', () => {
  assert.equal(parsePriceNumber('$39.99'), 39.99);
  assert.equal(parsePriceNumber('39,99 €'), 39.99);
  assert.equal(parsePriceNumber('1.299,00 €'), 1299);
  assert.equal(parsePriceNumber('$0.99'), 0.99);
  assert.equal(parsePriceNumber('Free'), null);
  assert.equal(parsePriceNumber(null), null);
  assert.equal(parsePriceNumber('$0.00'), null);
});

test('formatCurrencyLike keeps the store symbol and its side of the number', () => {
  assert.equal(formatCurrencyLike('$39.99', 0.1096), '$0.11');
  assert.equal(formatCurrencyLike('39,99 €', 0.1096), '0.11 €');
});

test('packagePriceCents prefers the store cents over the parsed string', () => {
  assert.equal(
    packagePriceCents({ priceString: '$39.99', priceCents: 3999 }),
    3999,
  );
  assert.equal(packagePriceCents({ priceString: '39,99 €' }), 3999);
  assert.equal(packagePriceCents(null), null);
});

test('computePerWeek divides the annual charge but not the weekly one', () => {
  assert.equal(
    computePerWeek({ id: 'annual', priceString: '$52.00' }),
    '$1.00',
  );
  assert.equal(
    computePerWeek({ id: 'weekly', priceString: '$4.99' }),
    '$4.99',
  );
});

test('computeAnnualSavings is the gap between the two weekly rates', () => {
  assert.equal(
    computeAnnualSavings(
      { id: 'annual', priceString: '$52.00' },
      { id: 'weekly', priceString: '$4.00' },
    ),
    75,
  );
  assert.equal(
    computeAnnualSavings(
      { id: 'annual', priceString: '$208.00' },
      { id: 'weekly', priceString: '$4.00' },
    ),
    null,
  );
  assert.equal(computeAnnualSavings(undefined, undefined), null);
});
