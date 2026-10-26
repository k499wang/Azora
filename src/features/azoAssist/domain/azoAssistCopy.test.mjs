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
