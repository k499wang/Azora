import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Home paints the room in three slices with the blob between them, so the one
 * thing that must stay true is that the slices reassemble into exactly the
 * picture `HexRoom` paints. `DECOR` and the day lists are read out of the
 * sources rather than imported — they sit in files this runner cannot load.
 */

function source(file) {
  return readFileSync(join(here, file), 'utf8');
}

function decor() {
  const src = source('RoomScene.tsx');
  const start = src.indexOf('export const DECOR: Record<string, Poly[]> = {');
  const end = src.indexOf('export const DECOR_KEYS');
  assert.ok(start !== -1 && end > start, 'could not find DECOR in RoomScene');

  const body = src
    .slice(start, end)
    .replace('export const DECOR: Record<string, Poly[]> = ', '')
    .trim()
    .replace(/;$/, '');

  return eval(`(${body})`);
}

function days(src, name) {
  const match = src.match(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`));
  assert.ok(match, `could not find ${name}`);

  return [...match[1].matchAll(/'(day\d)'/g)].map((day) => day[1]);
}

/** the front edge of a piece's base: the y past which the blob is in front of it */
function frontEdge(polys) {
  return Math.max(
    ...polys
      .filter((poly) => poly.sh !== 1)
      .flatMap((poly) =>
        poly.p
          .trim()
          .split(/\s+/)
          .map((pair) => Number(pair.split(',')[1]))
          .filter(Number.isFinite),
      ),
  );
}

function optionsOf(day) {
  return Object.entries(decor())
    .filter(([key]) => key.startsWith(`${day}.`))
    .map(([, polys]) => polys);
}

const paintOrder = days(source('RoomScene.tsx'), 'PAINT_ORDER');
const floorDays = days(source('roomLayers.ts'), 'FLOOR_DAYS');

test('the layers reassemble into the paint order HexRoom uses', () => {
  const base = paintOrder.filter((day) => !floorDays.includes(day));

  assert.deepEqual([...base, ...floorDays], paintOrder);
  assert.equal(base.length + floorDays.length, 7);
});

test('depth order is paint order, so one cut splits the room correctly', () => {
  const edges = floorDays.map((day) => optionsOf(day).map(frontEdge));

  for (let index = 1; index < edges.length; index += 1) {
    assert.ok(
      Math.max(...edges[index - 1]) < Math.min(...edges[index]),
      `${floorDays[index - 1]} and ${floorDays[index]} overlap in depth`,
    );
  }
});

test('nothing left in the base layer can ever stand in front of the blob', () => {
  // The blob's contact point never comes further back than the room's back
  // inset. A hung piece stops well above that, and the day 1 rug lies flat on
  // the floor, so both belong under it whatever it does.
  const BACK_OF_THE_WALK = 10;

  for (const day of paintOrder) {
    if (floorDays.includes(day) || day === 'day1') continue;

    for (const polys of optionsOf(day)) {
      assert.ok(
        frontEdge(polys) < BACK_OF_THE_WALK,
        `${day} reaches the floor at ${frontEdge(polys)}`,
      );
    }
  }
});
