import test from 'node:test';
import assert from 'node:assert/strict';
import { getRevenueCatTrialEndsAt } from './entitlementTrial.ts';

test('TRIAL period returns expirationDate', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: 'TRIAL',
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    '2026-06-01T09:00:00Z',
  );
});

test('NORMAL period returns null even when expirationDate is set', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: 'NORMAL',
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    null,
  );
});

test('INTRO period returns null', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: 'INTRO',
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    null,
  );
});

test('PREPAID period returns null', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: 'PREPAID',
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    null,
  );
});

test('lowercase "trial" is normalized to TRIAL', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: 'trial',
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    '2026-06-01T09:00:00Z',
  );
});

test('mixed-case "Trial" is normalized', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: 'Trial',
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    '2026-06-01T09:00:00Z',
  );
});

test('TRIAL with missing expirationDate returns null', () => {
  assert.equal(getRevenueCatTrialEndsAt({ periodType: 'TRIAL' }), null);
});

test('TRIAL with explicit null expirationDate returns null', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({ periodType: 'TRIAL', expirationDate: null }),
    null,
  );
});

test('null periodType returns null', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: null,
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    null,
  );
});

test('undefined periodType returns null', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({ expirationDate: '2026-06-01T09:00:00Z' }),
    null,
  );
});

test('unknown periodType string returns null', () => {
  assert.equal(
    getRevenueCatTrialEndsAt({
      periodType: 'SOMETHING_NEW',
      expirationDate: '2026-06-01T09:00:00Z',
    }),
    null,
  );
});
