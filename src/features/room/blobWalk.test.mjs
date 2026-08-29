import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BLOB_HALF_W,
  START,
  buildFloor,
  floorX,
  floorY,
  passedCount,
  planWalk,
} from './blobWalk';

/**
 * The three floor-standing days, at their deepest option — the worst room the
 * blob ever has to find its way around. Taken from the artwork: day 3 against
 * the left wall, day 2 against the right, day 4 a plant out on the floor.
 */
const FULL_ROOM = [
  { minX: -101, maxX: -31, maxY: 68 },
  { minX: 43, maxX: 132, maxY: 101 },
  { minX: 26, maxX: 68, maxY: 152 },
];

/** every waypoint of many routes, so a property holds over the whole floor */
function wander(grid, from = START, trips = 60) {
  const seen = [];

  for (let trip = 0; trip < trips; trip += 1) {
    const route = planWalk(grid, from, () => (trip + 0.5) / trips);
    seen.push(...route);
  }

  return seen;
}

test('an empty room is walkable almost everywhere, and inset from its edges', () => {
  const grid = buildFloor([], 'sorted');

  assert.ok(grid.open.length > 120, `only ${grid.open.length} cells open`);

  for (const point of wander(grid)) {
    assert.ok(point.a > 0 && point.a < 1, `a out of the floor: ${point.a}`);
    assert.ok(point.b > 0 && point.b < 1, `b out of the floor: ${point.b}`);
    // clear of the front edges, where there is no floor to catch its shadow
    assert.ok(point.a < 0.9 && point.b < 0.9, 'walked onto the front edge');
  }
});

test('it never stands in a decoration, and never behind one big enough to hide it', () => {
  const grid = buildFloor(FULL_ROOM, 'sorted');

  for (const cell of grid.open) {
    const point = { a: cellA(cell), b: cellB(cell) };
    const x = floorX(point);
    const y = floorY(point);

    for (const piece of FULL_ROOM) {
      if (y > piece.maxY) continue;

      assert.ok(
        !(piece.minX <= x - BLOB_HALF_W && x + BLOB_HALF_W <= piece.maxX),
        `hidden completely behind a piece at ${x.toFixed(0)},${y.toFixed(0)}`,
      );

      const inBase =
        x > piece.minX &&
        x < piece.maxX &&
        y > piece.maxY - (piece.maxX - piece.minX) * 0.577;
      assert.ok(
        !inBase,
        `standing in a piece's base at ${x.toFixed(0)},${y.toFixed(0)}`,
      );
    }
  }
});

test('a full room still leaves it the length and depth of the floor', () => {
  const grid = buildFloor(FULL_ROOM, 'sorted');
  const points = wander(grid);
  const xs = points.map(floorX);
  const ys = points.map(floorY);

  // The far right corner is the one place a full room really does take away:
  // the day 2 piece stands across it, and standing behind that piece would hide
  // the blob entirely. Everything else stays open.
  assert.ok(Math.min(...xs) < -90, `never went left: ${Math.min(...xs)}`);
  assert.ok(Math.max(...xs) > 55, `never crossed the room: ${Math.max(...xs)}`);
  assert.ok(Math.min(...ys) < 60, `never went back: ${Math.min(...ys)}`);
  assert.ok(Math.max(...ys) > 140, `never came forward: ${Math.max(...ys)}`);
});

test('it walks behind the pieces it can pass behind', () => {
  const grid = buildFloor(FULL_ROOM, 'sorted');
  const plant = FULL_ROOM[2];

  const passesBehind = wander(grid).some((point) => {
    const x = floorX(point);
    return (
      floorY(point) < plant.maxY &&
      x + BLOB_HALF_W > plant.minX &&
      x - BLOB_HALF_W < plant.maxX
    );
  });

  assert.ok(passesBehind, 'never went behind anything');
});

test('a flat host keeps the blob in front of every decoration', () => {
  const grid = buildFloor(FULL_ROOM, 'flat');

  assert.ok(grid.open.length > 0, 'nowhere at all to walk');

  for (const cell of grid.open) {
    const x = floorX({ a: cellA(cell), b: cellB(cell) });
    const y = floorY({ a: cellA(cell), b: cellB(cell) });

    for (const piece of FULL_ROOM) {
      const clearOfIt =
        y > piece.maxY ||
        x < piece.minX - BLOB_HALF_W ||
        x > piece.maxX + BLOB_HALF_W;

      assert.ok(
        clearOfIt,
        `would be drawn over a piece at ${x.toFixed(0)},${y.toFixed(0)}`,
      );
    }
  }
});

test('every leg of a route stays on walkable floor', () => {
  const grid = buildFloor(FULL_ROOM, 'sorted');

  for (let trip = 0; trip < 60; trip += 1) {
    const route = planWalk(grid, START, () => (trip + 0.5) / 60);
    assert.ok(route.length > 0, 'no route at all');

    let from = START;
    for (const to of route) {
      for (let step = 0; step <= 20; step += 1) {
        const t = step / 20;
        const a = from.a + (to.a - from.a) * t;
        const b = from.b + (to.b - from.b) * t;
        assert.ok(walkable(grid, a, b), `cut a corner at ${a}, ${b}`);
      }
      from = to;
    }
  }
});

test('a blob boxed into a corner asks for nothing rather than teleporting', () => {
  const grid = buildFloor([{ minX: -160, maxX: 160, maxY: 200 }], 'flat');

  assert.equal(grid.open.length, 0);
  assert.deepEqual(planWalk(grid, START), []);
});

test('it counts only the front edges it has actually walked past', () => {
  assert.equal(passedCount([68, 101, 152], 40), 0);
  assert.equal(passedCount([68, 101, 152], 110), 2);
  assert.equal(passedCount([68, 101, 152], 170), 3);
});

const CELLS = 16;
const cellA = (cell) => (Math.floor(cell / CELLS) + 0.5) / CELLS;
const cellB = (cell) => ((cell % CELLS) + 0.5) / CELLS;

function walkable(grid, a, b) {
  const i = Math.max(0, Math.min(CELLS - 1, Math.floor(a * CELLS)));
  const j = Math.max(0, Math.min(CELLS - 1, Math.floor(b * CELLS)));

  return grid.free[i * CELLS + j];
}
