import assert from 'node:assert/strict';
import test from 'node:test';
import { azoAssistCopyFor } from './azoAssistCopy.ts';

test('the tidy-home plan gets cleaning prompts and other plans keep the general ones', () => {
  assert.match(azoAssistCopyFor('home').chatHeading, /cleaning plan/);
  assert.equal(azoAssistCopyFor('focus'), azoAssistCopyFor(null));
  assert.notEqual(azoAssistCopyFor('home'), azoAssistCopyFor(null));
});

test('every plan opener keeps the question the server reads as a plan request', () => {
  for (const planId of ['home', 'focus', null]) {
    assert.ok(azoAssistCopyFor(planId).planOpener.startsWith('What’s on your mind today?'));
  }
});

test('every plan has several rows of distinct starters for the sliding pills', () => {
  for (const planId of ['home', 'focus', null]) {
    const { starters } = azoAssistCopyFor(planId);
    assert.ok(starters.length >= 2);
    const all = starters.flat();
    assert.equal(new Set(all).size, all.length);
    assert.ok(all.every((starter) => starter.trim().length > 0));
  }
});
