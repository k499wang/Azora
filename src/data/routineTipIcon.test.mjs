import assert from 'node:assert/strict';
import test from 'node:test';
import { routineTipIcon } from './routineTipIcon.ts';

test('a tip gets the picture of what it asks you to have ready', () => {
  assert.equal(routineTipIcon('Leave a clean glass somewhere easy to reach the night before.'), 'todo-water');
  assert.equal(routineTipIcon('Pick a place for your phone that still allows any essential calls.'), 'todo-screen-free');
  assert.equal(routineTipIcon('Keep a timer nearby for the short work block.'), 'todo-focus-timer');
  assert.equal(routineTipIcon('Have your calendar and any household plans nearby.'), 'todo-plan');
});

test('a tip with nothing to name still gets a picture', () => {
  assert.equal(routineTipIcon('Keep your eyes open.'), 'todo-priorities');
});
