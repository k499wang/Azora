import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanupMinutes, DEFAULT_ITEM_MINUTES, parseCleanupPlan } from './cleanupPlan.ts';

const validPlan = {
  title: 'A small room reset',
  objects: ['Cups and dishes', 'Food wrappers'],
  minutes: [3, 1],
  safetyNote: null,
};

test('accepts the constrained plan shape returned by the cleanup function', () => {
  assert.deepEqual(parseCleanupPlan(validPlan), {
    title: 'A small room reset',
    objects: [{ name: 'Cups and dishes', minutes: 3 }, { name: 'Food wrappers', minutes: 1 }],
    safetyNote: null,
  });
});

test('an older function without estimates still plans, with the default per item', () => {
  const plan = parseCleanupPlan({ ...validPlan, minutes: undefined });
  assert.deepEqual(plan?.objects.map((item) => item.minutes), [DEFAULT_ITEM_MINUTES, DEFAULT_ITEM_MINUTES]);
});

test('estimates that do not line up with the items are ignored rather than misassigned', () => {
  const plan = parseCleanupPlan({ ...validPlan, minutes: [5] });
  assert.deepEqual(plan?.objects.map((item) => item.minutes), [DEFAULT_ITEM_MINUTES, DEFAULT_ITEM_MINUTES]);
});

test('estimates are whole minutes kept between 1 and 15', () => {
  const plan = parseCleanupPlan({ ...validPlan, minutes: [0.2, 90] });
  assert.deepEqual(plan?.objects.map((item) => item.minutes), [1, 15]);
  assert.equal(cleanupMinutes(plan.objects), 16);
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
    objects: [{ name: 'Cups and dishes', minutes: DEFAULT_ITEM_MINUTES }],
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
