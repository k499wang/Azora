import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnnualSavings,
  computeDiscountPercent,
  computePerMonth,
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

test('computePerMonth spreads each billing period over a month', () => {
  assert.equal(
    computePerMonth({ id: 'annual', billingPeriod: 'year', priceString: '$60.00' }),
    '$5.00',
  );
  assert.equal(
    computePerMonth({ id: 'monthly', billingPeriod: 'month', priceString: '$9.99' }),
    '$9.99',
  );
  assert.equal(
    computePerMonth({ id: 'monthly', billingPeriod: 'week', priceString: '$4.99' }),
    '$21.62',
  );
});

test('computeDiscountPercent measures the discounted plan against the anchor', () => {
  assert.equal(
    computeDiscountPercent(
      { id: 'annual', priceString: '$79.99' },
      { id: 'annual', priceString: '$49.99' },
    ),
    38,
  );
  // Same price, or a discount that is not one, is not a discount.
  assert.equal(
    computeDiscountPercent(
      { id: 'annual', priceString: '$79.99' },
      { id: 'annual', priceString: '$79.99' },
    ),
    null,
  );
  assert.equal(computeDiscountPercent(null, null), null);
});

test('computeAnnualSavings is the gap between the two monthly rates', () => {
  assert.equal(
    computeAnnualSavings(
      { id: 'annual', billingPeriod: 'year', priceString: '$59.99' },
      { id: 'monthly', billingPeriod: 'month', priceString: '$9.99' },
    ),
    50,
  );
  assert.equal(
    computeAnnualSavings(
      { id: 'annual', billingPeriod: 'year', priceString: '$59.99' },
      { id: 'monthly', billingPeriod: 'week', priceString: '$4.99' },
    ),
    77,
  );
  assert.equal(
    computeAnnualSavings(
      { id: 'annual', billingPeriod: 'year', priceString: '$120.00' },
      { id: 'monthly', billingPeriod: 'month', priceString: '$10.00' },
    ),
    null,
  );
  assert.equal(computeAnnualSavings(undefined, undefined), null);
});
