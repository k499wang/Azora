import assert from 'node:assert/strict';
import test from 'node:test';

import { firstRoom, nextRoom } from './hotelWander';
import { HEX_W, slotAt } from './pyramidLayout';

/**
 * Two rooms share a wall when their centres are one hexagon apart. The
 * artwork's half-width is rounded to a tenth, so the diagonal neighbours land
 * a fraction of a unit off a perfect hexagon's.
 */
function adjacent(a, b) {
  const from = slotAt(a);
  const to = slotAt(b);
  return Math.abs(Math.hypot(to.x - from.x, to.y - from.y) - HEX_W) < 0.5;
}

test('the blob starts in the room being filled', () => {
  assert.equal(firstRoom(0), 0);
  assert.equal(firstRoom(1), 0);
  assert.equal(firstRoom(6), 5);
});

test('a one-room hotel has nowhere to go', () => {
  assert.equal(nextRoom(0, null, 1, 0.5), null);
});

test('every step is into a room that shares a wall and exists', () => {
  const occupied = 21;

  for (let at = 0; at < occupied; at += 1) {
    for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
      const next = nextRoom(at, null, occupied, roll);
      assert.ok(next != null, `room ${at} had nowhere to go`);
      assert.ok(next < occupied, `room ${at} stepped into an unbuilt room`);
      assert.ok(adjacent(at, next), `room ${at} jumped to ${next}`);
    }
  }
});

test('it walks on rather than doubling back, unless that is the only way', () => {
  // Floor 2 opens onto floor 1 and floor 3, so arriving from one leaves the
  // other.
  for (const roll of [0, 0.5, 0.999]) {
    assert.notEqual(nextRoom(1, 0, 3, roll), 0);
  }

  // With only floors 1 and 2 built there is one wall, and it goes back through
  // it rather than standing still.
  assert.equal(nextRoom(1, 0, 2, 0.5), 0);
});
