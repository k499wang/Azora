import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryState, isPlacedInAnotherRoom } from './inventory.ts';

const owned = (optionId) => ({ id: optionId, optionId, acquiredLocalDate: null });

test('inventory separates placed and free owned objects', () => {
  const state = inventoryState({
    owned: [owned('plant'), owned('rug')],
    placements: [{ roomId: 'room-1', slot: 'day1', optionId: 'plant' }],
  });
  assert.deepEqual([...state.ownedIds], ['plant', 'rug']);
  assert.deepEqual([...state.placedIds], ['plant']);
  assert.deepEqual([...state.freeIds], ['rug']);
});

test('unknown legacy placements do not manufacture ownership', () => {
  const state = inventoryState({
    owned: [owned('plant')],
    placements: [{ roomId: 'room-1', slot: 'day1', optionId: 'unknown' }],
  });
  assert.deepEqual([...state.placedIds], []);
  assert.deepEqual([...state.freeIds], ['plant']);
});

test('legacy duplicate placements count as one placed owned object', () => {
  const placements = [
    { roomId: 'room-1', slot: 'day1', optionId: 'plant' },
    { roomId: 'room-2', slot: 'day2', optionId: 'plant' },
  ];
  const state = inventoryState({ owned: [owned('plant')], placements });
  assert.deepEqual([...state.placedIds], ['plant']);
  assert.equal(isPlacedInAnotherRoom(placements, 'plant', 'room-1'), true);
  assert.equal(isPlacedInAnotherRoom(placements, 'plant', 'room-3'), true);
  assert.equal(isPlacedInAnotherRoom(placements, 'rug', 'room-1'), false);
});
