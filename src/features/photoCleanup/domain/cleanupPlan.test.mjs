import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCleanupPlan } from './cleanupPlan.ts';

const validPlan = {
  title: 'A small room reset',
  objects: ['Cups and dishes', 'Food wrappers'],
  safetyNote: null,
};

test('accepts the constrained plan shape returned by the cleanup function', () => {
  assert.deepEqual(parseCleanupPlan(validPlan), validPlan);
});

test('accepts a longer ordered object list', () => {
  assert.ok(
    parseCleanupPlan({
      ...validPlan,
      objects: Array.from({ length: 8 }, () => 'Clothes'),
    }) != null,
  );
});

test('keeps a valid object queue when the unused model title is absent', () => {
  const plan = parseCleanupPlan({
    objects: ['Cups and dishes'],
    safetyNote: null,
  });

  assert.deepEqual(plan, {
    title: 'Your cleaning plan',
    objects: ['Cups and dishes'],
    safetyNote: null,
  });
});

test('treats Gemini’s empty safety note as no warning', () => {
  const plan = parseCleanupPlan({
    title: 'Start here',
    objects: ['Cups and dishes'],
    safetyNote: '',
  });

  assert.equal(plan?.safetyNote, null);
});

test('rejects an object list that is longer than the UI can safely present', () => {
  assert.equal(
    parseCleanupPlan({
      ...validPlan,
      objects: Array.from({ length: 21 }, () => 'Clothes'),
    }),
    null,
  );
});

test('rejects object entries that are not readable labels', () => {
  assert.equal(
    parseCleanupPlan({
      ...validPlan,
      objects: ['Cups', ''],
    }),
    null,
  );
});
