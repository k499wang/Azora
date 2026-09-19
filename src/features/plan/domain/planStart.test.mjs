import assert from 'node:assert/strict';
import test from 'node:test';
import { planStartOffer } from './planStart';
import { buildIntentTitleLookup } from '../../../lib/planProgress';

const TITLES = buildIntentTitleLookup([
  { id: 'sleep', title: 'Sleep better' },
  { id: 'focus', title: 'Stay focused' },
  { id: 'stress_relief', title: 'Reduce stress' },
]);

test('the offer is built from the goal the user already gave us', () => {
  const offer = planStartOffer('Sleep better', TITLES);

  assert.equal(offer.planId, 'night');
  assert.equal(offer.isFallback, false);
  assert.ok(offer.weeks > 0);
  assert.ok(offer.planName.length > 0);
});

test('the first goal they ranked is the one the plan is built around', () => {
  // Same order `resolvePlanIntent` reads, so the seal and this agree.
  assert.equal(planStartOffer('Stay focused, Sleep better', TITLES).planId, 'focus');
});

test('a goal this build cannot read still gets a plan, and says so', () => {
  // A goal written by a build whose titles have since changed.
  const offer = planStartOffer('Some retired goal', TITLES);

  assert.equal(offer.isFallback, true);
  assert.ok(offer.weeks > 0);
});

test('no goal at all is the same broad plan rather than no plan', () => {
  for (const goal of [null, undefined, '']) {
    const offer = planStartOffer(goal, TITLES);
    assert.equal(offer.isFallback, true);
    assert.equal(offer.planId, planStartOffer('Some retired goal', TITLES).planId);
  }
});
