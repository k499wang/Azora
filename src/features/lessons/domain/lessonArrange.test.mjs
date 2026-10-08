import test from 'node:test';
import assert from 'node:assert/strict';
import { arrangeBankOrder } from './lessonArrange.ts';
import { allLessons } from './lessonCatalogue.ts';

const sequences = allLessons().flatMap(lesson => lesson.blocks.filter(block => block.kind === 'sequence'));

test('every arrange bank is a stable shuffle of its steps, never already in order', () => {
  assert.ok(sequences.length > 0);
  for (const block of sequences) {
    const order = arrangeBankOrder(block.steps);
    assert.deepEqual([...order].sort((a, b) => a - b), block.steps.map((_, index) => index));
    assert.deepEqual(arrangeBankOrder(block.steps), order);
    if (block.steps.length > 1) assert.notDeepEqual(order, block.steps.map((_, index) => index));
  }
});

test('a bank that shuffles into order is turned once', () => {
  for (const steps of [['a', 'b'], ['x', 'y', 'z'], ['one', 'two', 'three', 'four']]) {
    const order = arrangeBankOrder(steps);
    assert.notDeepEqual(order, steps.map((_, index) => index));
  }
});
