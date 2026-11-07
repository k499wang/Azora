import test from 'node:test';
import assert from 'node:assert/strict';
import { createBootPaywallLatch } from './bootPaywallLatch.ts';

test('the boot paywall presents once per launch for one account', () => {
  const latch = createBootPaywallLatch();
  assert.equal(latch.hasPresented('user-a'), false);
  latch.markPresented('user-a');
  assert.equal(latch.hasPresented('user-a'), true);
});

test('switching accounts in one launch does not spend the next account\'s paywall', () => {
  const latch = createBootPaywallLatch();
  latch.markPresented('user-a');
  assert.equal(latch.hasPresented('user-b'), false);
});
