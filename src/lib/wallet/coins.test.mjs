import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceOf, canAfford } from './coins.ts';

test('balance is the sum of ledger entries', () => {
  assert.equal(balanceOf([]), 0);
  assert.equal(balanceOf([{ delta: 25 }, { delta: 5 }, { delta: -30 }]), 0);
});

test('affordability includes exact balance and free setup', () => {
  assert.equal(canAfford(30, 30), true);
  assert.equal(canAfford(25, 30), false);
  assert.equal(canAfford(35, 30), true);
  assert.equal(canAfford(0, 0), true);
});

test('invalid balances or prices never enable a purchase', () => {
  for (const value of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(canAfford(value, 0), false);
    assert.equal(canAfford(100, value), false);
  }
});
