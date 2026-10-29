import assert from 'node:assert/strict';
import test from 'node:test';
import { messStressEcho } from './onboardingMessStress.ts';

test('mess stress reads high from an overwhelming space or most statements agreed', () => {
  assert.match(messStressEcho(['overwhelming'], {}), /^high/);
  assert.match(messStressEcho(['cluttered'], { a: 'yes', b: 'yes', c: 'yes', d: 'yes' }), /^high/);
});

test('mess stress reads moderate or low for a lighter load', () => {
  assert.match(messStressEcho(['cluttered'], { a: 'no' }), /^moderate/);
  assert.match(messStressEcho(['mostly_clean'], { a: 'yes', b: 'no' }), /^low/);
});

test('mess stress says nothing when neither question was answered', () => {
  assert.equal(messStressEcho(undefined, {}), null);
  assert.equal(messStressEcho([], { a: undefined }), null);
});
