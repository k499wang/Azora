import assert from 'node:assert/strict';
import test from 'node:test';
import { isPlanDayGated } from './planDayGate.ts';

test('a free account opens the first two days and is asked for Pro from the third', () => {
  assert.equal(isPlanDayGated(false, 0), false);
  assert.equal(isPlanDayGated(false, 1), false);
  assert.equal(isPlanDayGated(false, 2), true);
  assert.equal(isPlanDayGated(true, 9), false);
  assert.equal(isPlanDayGated(false, null), false);
});
