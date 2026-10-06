import assert from 'node:assert/strict';
import test from 'node:test';

import { createProgressLedger } from './onboardingMilestones';

test('crossing a threshold going forward plays its milestone once', () => {
  const ledger = createProgressLedger(0);
  ledger.advance(0.1);
  assert.equal(ledger.advance(0.2).milestone, null);
  assert.equal(ledger.advance(0.3).milestone?.label, 'Nice start');
  assert.equal(ledger.advance(0.4).milestone, null);
});

test('a back-step never lands or celebrates, and re-crossing stays quiet', () => {
  const ledger = createProgressLedger(0);
  ledger.advance(0.4);
  assert.deepEqual(ledger.advance(0.55), {
    lands: true,
    milestone: { at: 0.5, label: 'Halfway there' },
  });
  assert.deepEqual(ledger.advance(0.45), { lands: false, milestone: null });
  assert.equal(ledger.advance(0.55).milestone, null);
});

test('the first screen with a bar lands without a milestone', () => {
  const ledger = createProgressLedger(0);
  assert.deepEqual(ledger.advance(0.3), { lands: true, milestone: null });
  assert.equal(ledger.advance(0.6).milestone?.label, 'Halfway there');
});

test('a jump across two thresholds plays only the higher one', () => {
  const ledger = createProgressLedger(0);
  ledger.advance(0.2);
  assert.equal(ledger.advance(0.8).milestone?.label, 'Almost done');
  assert.equal(ledger.advance(0.9).milestone, null);
});
