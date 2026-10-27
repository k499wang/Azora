import assert from 'node:assert/strict';
import test from 'node:test';
import { addItem, clampItemMinutes, cleanItemName, MAX_ITEMS, moveItem, removeItem, replaceItem } from './cleanupPlanEdits.ts';

const items = [
  { name: 'Mugs on the desk', minutes: 1 },
  { name: 'Clothes on the bed', minutes: 4 },
  { name: 'Shoes by the door', minutes: 2 },
];

test('moving swaps with the neighbour and stops at either end', () => {
  assert.deepEqual(moveItem(items, 1, -1).map((item) => item.name), ['Clothes on the bed', 'Mugs on the desk', 'Shoes by the door']);
  assert.deepEqual(moveItem(items, 0, -1), items);
  assert.deepEqual(moveItem(items, 2, 1), items);
});

test('replace, remove, and add leave the other items alone', () => {
  assert.equal(replaceItem(items, 1, { name: 'Laundry', minutes: 6 })[1].name, 'Laundry');
  assert.deepEqual(removeItem(items, 0).map((item) => item.name), ['Clothes on the bed', 'Shoes by the door']);
  assert.equal(addItem(items, { name: 'Bins', minutes: 2 }).length, 4);
  const full = Array.from({ length: MAX_ITEMS }, (_, i) => ({ name: `Item ${i}`, minutes: 1 }));
  assert.equal(addItem(full, { name: 'One more', minutes: 1 }).length, MAX_ITEMS);
});

test('typed names are trimmed and blank names are refused; minutes stay between 1 and 60', () => {
  assert.equal(cleanItemName('  Dishes   in the sink '), 'Dishes in the sink');
  assert.equal(cleanItemName('   '), null);
  assert.equal(clampItemMinutes(0), 1);
  assert.equal(clampItemMinutes(90), 60);
});
