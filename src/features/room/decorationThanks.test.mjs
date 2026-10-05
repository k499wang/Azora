import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DECORATION_THANKS,
  NEW_ROOM_THANKS,
  hasNewDecoration,
  hasNewRoom,
  nextGreetingIndex,
  roomDecorationKeys,
} from './decorationThanks';

const room = (id, slots) => ({
  id,
  floor: 1,
  shell: 'default',
  frameHue: 'blue',
  decorations: slots.map((slot) => ({ slot, optionId: 'x', earnedLocalDate: '2026-10-03' })),
});

test('twenty distinct thank-you lines, each short enough for the bubble', () => {
  assert.equal(DECORATION_THANKS.length, 20);
  assert.equal(new Set(DECORATION_THANKS).size, 20);
  for (const line of DECORATION_THANKS) assert.ok(line.length <= 44, line);
});

test('a piece placed since the last look is new; the same pieces are not', () => {
  const seen = new Set(roomDecorationKeys(room('r1', ['lamp'])));

  assert.equal(hasNewDecoration(seen, roomDecorationKeys(room('r1', ['lamp']))), false);
  assert.equal(hasNewDecoration(seen, roomDecorationKeys(room('r1', ['lamp', 'rug']))), true);
  assert.equal(hasNewDecoration(seen, roomDecorationKeys(room('r2', ['lamp']))), true);
  assert.deepEqual(roomDecorationKeys(null), []);
});

const ROLLS = Array.from({ length: 20 }, (_, index) => index / 20);

test('never repeats the line said last, and reaches every line', () => {
  const said = new Set();
  for (let previous = -1; previous < DECORATION_THANKS.length; previous += 1) {
    for (const roll of ROLLS) {
      const next = nextGreetingIndex(previous, DECORATION_THANKS.length, () => roll);
      assert.notEqual(next, previous);
      assert.ok(next >= 0 && next < DECORATION_THANKS.length);
      said.add(next);
    }
  }
  assert.equal(said.size, DECORATION_THANKS.length);
});

test('new-room lines are distinct, short, and never repeat immediately', () => {
  assert.equal(new Set(NEW_ROOM_THANKS).size, NEW_ROOM_THANKS.length);
  const said = new Set();
  for (const line of NEW_ROOM_THANKS) assert.ok(line.length <= 44, line);
  for (let previous = -1; previous < NEW_ROOM_THANKS.length; previous += 1) {
    for (const roll of ROLLS) {
      const next = nextGreetingIndex(previous, NEW_ROOM_THANKS.length, () => roll);
      assert.notEqual(next, previous);
      assert.ok(next >= 0 && next < NEW_ROOM_THANKS.length);
      said.add(next);
    }
  }
  assert.equal(said.size, NEW_ROOM_THANKS.length);
});

test('room changes greet even an empty new room, but initial loads and decorations do not', () => {
  assert.equal(hasNewRoom(undefined, room('r1', [])), false);
  assert.equal(hasNewRoom('r1', room('r1', ['lamp'])), false);
  assert.equal(hasNewRoom('r1', room('r2', [])), true);
  assert.equal(hasNewRoom('r2', room('r2', [])), false);
  assert.equal(hasNewRoom('r1', null), false);
  assert.equal(hasNewRoom(null, room('r1', [])), true);
});
