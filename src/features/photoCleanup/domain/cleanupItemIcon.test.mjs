import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanupItemIcon } from './cleanupItemIcon.ts';

test('what the item is wins over where it sits', () => {
  assert.equal(cleanupItemIcon('Mugs on the desk'), 'todo-dishes');
  assert.equal(cleanupItemIcon('Clothes on the bed'), 'todo-hamper');
  assert.equal(cleanupItemIcon('Shoes by the door'), 'todo-shoes');
});

test('a place alone still gets its own picture, and anything else gets the broom', () => {
  assert.equal(cleanupItemIcon('Things on the nightstand'), 'todo-surface');
  assert.equal(cleanupItemIcon('Unmade bed'), 'todo-bed');
  assert.equal(cleanupItemIcon('Random stuff'), 'todo-broom');
});
