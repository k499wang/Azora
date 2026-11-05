import test from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The stub shipped for non-native environments has no methods at all.
const stored = new Map();
let failReads = false;
AsyncStorage.setItem = async (key, value) => {
  stored.set(key, value);
};
AsyncStorage.getItem = async (key) => {
  if (failReads) throw new Error('disk error');
  return stored.get(key) ?? null;
};

const {
  isEnjoymentPromptDue,
  loadEnjoymentPromptRecord,
  markEnjoymentPromptShown,
} = await import('./enjoymentPromptState.ts');

const DAY_ONE = '2026-11-04';
const DAY_TWO = '2026-11-05';

test.beforeEach(() => {
  stored.clear();
  failReads = false;
});

test('the first visit starts the clock and is not due that day', async () => {
  const record = await loadEnjoymentPromptRecord('user', DAY_ONE);
  assert.equal(record, DAY_ONE);
  assert.equal(isEnjoymentPromptDue(record, DAY_ONE), false);
});

test('a later visit keeps the first date and is due on the next day', async () => {
  await loadEnjoymentPromptRecord('user', DAY_ONE);
  const record = await loadEnjoymentPromptRecord('user', DAY_TWO);
  assert.equal(record, DAY_ONE);
  assert.equal(isEnjoymentPromptDue(record, DAY_TWO), true);
});

test('a user who skips day two is asked on the next day they return', () => {
  assert.equal(isEnjoymentPromptDue(DAY_ONE, '2026-11-20'), true);
});

test('it is never due again once shown', async () => {
  await loadEnjoymentPromptRecord('user', DAY_ONE);
  await markEnjoymentPromptShown('user');
  const record = await loadEnjoymentPromptRecord('user', DAY_TWO);
  assert.equal(isEnjoymentPromptDue(record, '2027-11-05'), false);
});

test('each account has its own clock', async () => {
  await loadEnjoymentPromptRecord('first', DAY_ONE);
  assert.equal(await loadEnjoymentPromptRecord('second', DAY_TWO), DAY_TWO);
});

test('a storage failure does not ask', async () => {
  failReads = true;
  const record = await loadEnjoymentPromptRecord('user', DAY_TWO);
  assert.equal(isEnjoymentPromptDue(record, '2027-11-05'), false);
});
