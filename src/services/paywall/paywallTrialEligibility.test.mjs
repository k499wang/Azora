import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatEligibleTrialLabel,
  hasFreeTrialIntroPrice,
  isEligibleTrialStatus,
} from './paywallTrialEligibility.ts';

const ELIGIBLE = 2;
const INELIGIBLE = 1;
const UNKNOWN = 0;

function introPrice(overrides = {}) {
  return {
    price: 0,
    periodUnit: 'DAY',
    periodNumberOfUnits: 3,
    ...overrides,
  };
}

test('eligible free intro offer gets a trial label', () => {
  assert.equal(
    formatEligibleTrialLabel({
      introPrice: introPrice(),
      eligibilityStatus: ELIGIBLE,
    }),
    '7-day free trial',
  );
});

test('ineligible intro offer gets no trial label', () => {
  assert.equal(
    formatEligibleTrialLabel({
      introPrice: introPrice(),
      eligibilityStatus: INELIGIBLE,
    }),
    null,
  );
});

test('unknown eligibility gets no trial label', () => {
  assert.equal(
    formatEligibleTrialLabel({
      introPrice: introPrice(),
      eligibilityStatus: UNKNOWN,
    }),
    null,
  );
});

test('missing eligibility, such as a failed check, gets no trial label', () => {
  assert.equal(
    formatEligibleTrialLabel({
      introPrice: introPrice(),
      eligibilityStatus: null,
    }),
    null,
  );
});

test('product without free intro offer gets no trial label', () => {
  assert.equal(
    formatEligibleTrialLabel({
      introPrice: introPrice({ price: 9.99 }),
      eligibilityStatus: ELIGIBLE,
    }),
    null,
  );
});

test('free intro offer detection requires a zero price', () => {
  assert.equal(hasFreeTrialIntroPrice(introPrice()), true);
  assert.equal(hasFreeTrialIntroPrice(introPrice({ price: 4.99 })), false);
  assert.equal(hasFreeTrialIntroPrice(null), false);
});

test('only RevenueCat eligible status is treated as eligible', () => {
  assert.equal(isEligibleTrialStatus(ELIGIBLE), true);
  assert.equal(isEligibleTrialStatus(INELIGIBLE), false);
  assert.equal(isEligibleTrialStatus(UNKNOWN), false);
  assert.equal(isEligibleTrialStatus(undefined), false);
});
