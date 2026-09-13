import assert from 'node:assert/strict';
import test from 'node:test';

import { echoOption, echoSingle } from './onboardingEcho';

const OPTIONS = [
  { id: 'tired', echo: 'you’re too tired' },
  { id: 'start', echo: 'you don’t know where to start' },
  { id: 'quiet' },
];

test('a single pick comes back as the fragment written for it', () => {
  assert.equal(echoOption(OPTIONS, ['tired']), 'you’re too tired');
  assert.equal(echoSingle(OPTIONS, 'start'), 'you don’t know where to start');
});

test('more than one pick is never echoed', () => {
  assert.equal(echoOption(OPTIONS, ['tired', 'start']), null);
});

test('an unanswered or skipped question is never echoed', () => {
  assert.equal(echoOption(OPTIONS, []), null);
  assert.equal(echoSingle(OPTIONS, null), null);
  assert.equal(echoSingle(OPTIONS, undefined), null);
});

test('an option with no fragment written for it is never echoed', () => {
  assert.equal(echoOption(OPTIONS, ['quiet']), null);
  assert.equal(echoSingle(OPTIONS, 'missing'), null);
});
