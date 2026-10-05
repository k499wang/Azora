import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanupCompletionCopy } from './cleanupCompletionCopy.ts';

test('an entirely removed list does not claim a cleanup win', () => {
  const copy = cleanupCompletionCopy(0);
  assert.equal(copy.title, 'List cleared');
  assert.match(copy.subtitle, /No items were marked done/);
});

test('completion copy counts only finished items with singular and plural wording', () => {
  assert.match(cleanupCompletionCopy(1).subtitle, /1 thing\./);
  assert.match(cleanupCompletionCopy(6).subtitle, /6 things\./);
});
