import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecorationCollection } from './decorationCollection.ts';

const catalog = ['a', 'b', 'c', 'd', 'e'].map((optionId, index) => ({
  day: `day${index + 1}`,
  optionId,
  name: optionId.toUpperCase(),
}));

test('owned pieces lead, most recent first, then locked ones fill the grid', () => {
  const collection = buildDecorationCollection(
    catalog,
    [
      { optionId: 'b', acquiredLocalDate: '2026-03-01' },
      { optionId: 'd', acquiredLocalDate: '2026-03-05' },
    ],
    4,
  );

  assert.equal(collection.ownedCount, 2);
  assert.equal(collection.total, 5);
  assert.deepEqual(
    collection.tiles.map((tile) => [tile.kind, tile.key]),
    [
      ['owned', 'day4.d'],
      ['owned', 'day2.b'],
      ['locked', 'day1.a'],
      ['locked', 'day3.c'],
    ],
  );
});

test('a piece owned twice counts once, dated by its latest copy', () => {
  const collection = buildDecorationCollection(
    catalog,
    [
      { optionId: 'a', acquiredLocalDate: '2026-01-01' },
      { optionId: 'c', acquiredLocalDate: '2026-02-01' },
      { optionId: 'a', acquiredLocalDate: '2026-03-01' },
    ],
    2,
  );

  assert.equal(collection.ownedCount, 2);
  assert.deepEqual(
    collection.tiles.map((tile) => tile.key),
    ['day1.a', 'day3.c'],
  );
});

test('an owned id outside the catalog is ignored and undated pieces sort last', () => {
  const collection = buildDecorationCollection(
    catalog,
    [
      { optionId: 'zz', acquiredLocalDate: '2026-04-01' },
      { optionId: 'e', acquiredLocalDate: null },
      { optionId: 'b', acquiredLocalDate: '2026-01-01' },
    ],
    3,
  );

  assert.equal(collection.ownedCount, 2);
  assert.deepEqual(
    collection.tiles.map((tile) => tile.key),
    ['day2.b', 'day5.e', 'day1.a'],
  );
});
