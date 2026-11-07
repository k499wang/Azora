import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPackageFirst, defaultPackageId, singlePackage } from './singlePackage.ts';

const annual = { id: 'annual', isRecommended: true };
const weekly = { id: 'monthly', isRecommended: false };

test('a named package wins, then the recommended one, then whatever exists', () => {
  assert.equal(singlePackage({ onlyPackageId: 'monthly', packages: [annual, weekly] }), weekly);
  assert.equal(singlePackage({ onlyPackageId: null, packages: [annual, weekly] }), annual);
  assert.equal(singlePackage({ onlyPackageId: null, packages: [weekly] }), weekly);
  assert.equal(singlePackage({ onlyPackageId: 'annual', packages: [weekly] }), weekly);
  assert.equal(singlePackage({ onlyPackageId: null, packages: [] }), null);
  assert.equal(singlePackage(null), null);
});

test('a weekly free trial is selected by default unless another plan is also free', () => {
  const monthlyPaid = { id: 'annual', isRecommended: true, billingPeriod: 'month', trialLabel: null };
  const weeklyFree = { id: 'monthly', isRecommended: false, billingPeriod: 'week', trialLabel: '3-day free trial' };
  const weeklyPaid = { ...weeklyFree, trialLabel: null };
  const annualFree = { id: 'annual', isRecommended: true, billingPeriod: 'year', trialLabel: '7-day free trial' };
  assert.equal(defaultPackageId([monthlyPaid, weeklyFree]), 'monthly');
  assert.equal(defaultPackageId([monthlyPaid, weeklyPaid]), 'annual');
  assert.equal(defaultPackageId([annualFree, weeklyPaid]), 'annual');
  assert.equal(defaultPackageId([annualFree, weeklyFree]), 'annual');
  assert.equal(defaultPackageId([]), null);
  assert.equal(singlePackage({ onlyPackageId: null, packages: [monthlyPaid, weeklyFree] }), weeklyFree);
  assert.equal(singlePackage({ onlyPackageId: 'annual', packages: [monthlyPaid, weeklyFree] }), monthlyPaid);
});

test('the default plan sits on the left in side-by-side order', () => {
  const monthlyPaid = { id: 'annual', isRecommended: true, billingPeriod: 'month', trialLabel: null };
  const weeklyFree = { id: 'monthly', isRecommended: false, billingPeriod: 'week', trialLabel: '3-day free trial' };
  const weeklyPaid = { ...weeklyFree, trialLabel: null };
  assert.deepEqual(defaultPackageFirst([monthlyPaid, weeklyFree]), [weeklyFree, monthlyPaid]);
  assert.deepEqual(defaultPackageFirst([monthlyPaid, weeklyPaid]), [monthlyPaid, weeklyPaid]);
  assert.deepEqual(defaultPackageFirst([]), []);
});
