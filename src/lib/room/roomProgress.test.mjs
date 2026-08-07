import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOM_SLOTS, roomProgress } from './roomProgress.ts';

const TODAY = '2026-08-07';

function decorationsThrough(count, earnedLocalDate = '2026-08-01') {
  return ROOM_SLOTS.slice(0, count).map((slot) => ({ slot, earnedLocalDate }));
}

function progress(overrides = {}) {
  return roomProgress({
    decorations: [],
    lastEarnedLocalDate: null,
    todayLocalDate: TODAY,
    dailiesComplete: true,
    ...overrides,
  });
}

test('an empty room opens on the first slot', () => {
  const result = progress();
  assert.equal(result.placedCount, 0);
  assert.equal(result.nextSlot, 'day1');
  assert.equal(result.isComplete, false);
});

test('slots advance in order', () => {
  const result = progress({ decorations: decorationsThrough(3) });
  assert.equal(result.placedCount, 3);
  assert.equal(result.nextSlot, 'day4');
});

test('a seventh object completes the room and closes the next slot', () => {
  const result = progress({ decorations: decorationsThrough(7) });
  assert.equal(result.placedCount, 7);
  assert.equal(result.nextSlot, null);
  assert.equal(result.isComplete, true);
  assert.equal(result.canClaim, false);
});

test('unfinished dailies block the claim', () => {
  const result = progress({ dailiesComplete: false });
  assert.equal(result.canClaim, false);
  assert.equal(result.nextSlot, 'day1');
});

test('finished dailies on an unclaimed day allow the claim', () => {
  const result = progress({ lastEarnedLocalDate: '2026-08-06' });
  assert.equal(result.claimedToday, false);
  assert.equal(result.canClaim, true);
});

test('a day already earned cannot be earned twice', () => {
  const result = progress({ lastEarnedLocalDate: TODAY });
  assert.equal(result.claimedToday, true);
  assert.equal(result.canClaim, false);
});

test('opening a new room does not reset the one-per-day rule', () => {
  // The seventh piece was placed today and floor 2 is empty — room-scoped
  // state would read this as a fresh day and hand out a second object.
  const result = progress({ decorations: [], lastEarnedLocalDate: TODAY });
  assert.equal(result.placedCount, 0);
  assert.equal(result.nextSlot, 'day1');
  assert.equal(result.canClaim, false);
});

test('slots the app no longer knows how to draw do not advance the sequence', () => {
  const result = progress({
    decorations: [
      { slot: 'day1', earnedLocalDate: '2026-08-01' },
      { slot: 'day99', earnedLocalDate: '2026-08-02' },
    ],
  });
  assert.equal(result.placedCount, 1);
  assert.equal(result.nextSlot, 'day2');
});

test('a room with gaps fills them rather than dead-ending on a taken slot', () => {
  // The old picker let objects land anywhere. Indexing by count would send the
  // fourth object to day5, which is occupied, and the room could never finish.
  const result = progress({
    decorations: [
      { slot: 'day1', earnedLocalDate: '2026-08-01' },
      { slot: 'day3', earnedLocalDate: '2026-08-02' },
      { slot: 'day5', earnedLocalDate: '2026-08-03' },
    ],
  });
  assert.equal(result.placedCount, 3);
  assert.equal(result.nextSlot, 'day2');
});

test('a duplicated slot counts once', () => {
  const result = progress({
    decorations: [
      { slot: 'day1', earnedLocalDate: '2026-08-01' },
      { slot: 'day1', earnedLocalDate: '2026-08-02' },
    ],
  });
  assert.equal(result.placedCount, 1);
  assert.equal(result.nextSlot, 'day2');
});
