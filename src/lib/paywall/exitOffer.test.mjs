import assert from 'node:assert/strict';
import test from 'node:test';
import { exitOfferAnchor, exitOfferCaption, exitOfferPackage, previewExitOfferPackage } from './exitOffer.ts';

const plan = (id, billingPeriod, extra = {}) => ({
  id, billingPeriod, title: billingPeriod, priceString: '$9.99', priceCents: 999, trialLabel: null, introOffer: null, ...extra,
});

test('the offer sells the first slot, and falls back to a lone short plan', () => {
  const annual = plan('annual', 'year');
  const short = plan('monthly', 'week');
  assert.equal(exitOfferPackage([short, annual]), annual);
  assert.equal(exitOfferPackage([short]), short);
  assert.equal(exitOfferPackage([]), null);
  assert.equal(exitOfferPackage(null), null);
});

test('a discount is only measured against the same billing period', () => {
  const regular = [plan('annual', 'year'), plan('monthly', 'month')];
  assert.equal(exitOfferAnchor(regular, plan('annual', 'month')), regular[1]);
  assert.equal(exitOfferAnchor(regular, plan('annual', 'year')), regular[0]);
  assert.equal(exitOfferAnchor(regular, plan('monthly', 'week')), null);
  assert.equal(exitOfferAnchor(regular, null), null);
});

test('the caption names the real plan and any intro before it', () => {
  assert.equal(exitOfferCaption(plan('annual', 'year'), '$5.00'), 'About $5.00/month');
  assert.equal(exitOfferCaption(plan('annual', 'year'), null), 'For annual plan');
  assert.equal(exitOfferCaption(plan('annual', 'month'), '$9.99'), 'For monthly plan');
  assert.equal(exitOfferCaption(plan('monthly', 'week'), null), 'For weekly plan');
  assert.equal(exitOfferCaption(plan('monthly', 'week', { trialLabel: '3-day free trial' }), null), 'After your 3-day free trial');
  assert.equal(
    exitOfferCaption(plan('annual', 'month', { introOffer: { days: 7, priceString: '$0.99' } }), null),
    'After 7 days for $0.99',
  );
});

test('previews change the period and trial without touching the rest', () => {
  const weekly = previewExitOfferPackage(plan('annual', 'year'), { period: 'week', trial: 'free' });
  assert.equal(`${weekly.id} ${weekly.billingPeriod} ${weekly.priceString} ${weekly.trialDays}`, 'annual week $2.99 7');
  assert.equal(previewExitOfferPackage(plan('annual', 'year'), { trial: 'free' }).billingPeriod, 'year');

  const paid = previewExitOfferPackage(plan('annual', 'year', { trialLabel: '7-day free trial', trialDays: 7 }), { period: 'month', trial: 'paid' });
  assert.equal(`${paid.billingPeriod} ${paid.trialLabel} ${paid.introOffer.days} ${paid.introOffer.priceString}`, 'month null 7 $0.99');
  assert.equal(exitOfferCaption(paid, null), 'After 7 days for $0.99');
});
