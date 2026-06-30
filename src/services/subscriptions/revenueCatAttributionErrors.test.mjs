import test from 'node:test';
import assert from 'node:assert/strict';
import { isRevenueCatAppsFlyerIdImmutableError } from './revenueCatAttributionErrors.ts';

test('identifies RevenueCat immutable AppsFlyer ID errors as terminal', () => {
  assert.equal(
    isRevenueCatAppsFlyerIdImmutableError(new Error('AppsFlyer ID cannot be modified.')),
    true,
  );
  assert.equal(
    isRevenueCatAppsFlyerIdImmutableError({
      message: 'Backend rejected subscriber attribute',
      userInfo: {
        underlyingErrorMessage: '$appsflyerId already set for this subscriber',
      },
    }),
    true,
  );
});

test('does not treat unrelated RevenueCat attribution errors as terminal', () => {
  assert.equal(
    isRevenueCatAppsFlyerIdImmutableError(new Error('Purchases has not been configured.')),
    false,
  );
  assert.equal(
    isRevenueCatAppsFlyerIdImmutableError(new Error('Network request failed while setting AppsFlyer ID')),
    false,
  );
  assert.equal(isRevenueCatAppsFlyerIdImmutableError(null), false);
});
