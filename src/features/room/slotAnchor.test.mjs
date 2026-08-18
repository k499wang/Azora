import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The "+" that stands in for an empty slot is placed from the artwork itself —
 * the centre of everything that day can hold. That only works while the anchor
 * lands inside the hexagon: a piece redrawn off to one side would leave the
 * button floating on bare canvas next to the room.
 *
 * `DECOR` is parsed out of the scene rather than imported — it sits in a `.tsx`
 * file alongside components this runner cannot load.
 */

const VIEW_BOX = { x: -168, y: -194, width: 336, height: 388 };
const HEX = [
  [0, -180],
  [155.9, -90],
  [155.9, 90],
  [0, 180],
  [-155.9, 90],
  [-155.9, -90],
];
const DAYS = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];

function decor() {
  const src = readFileSync(join(here, 'RoomScene.tsx'), 'utf8');
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

/** the same anchor `slotAnchor` computes, in room space */
function anchor(DECOR, day) {
  const points = Object.entries(DECOR)
    .filter(([key]) => key.startsWith(`${day}.`))
    .flatMap(([, polys]) => polys.filter((poly) => poly.sh !== 1))
    .flatMap((poly) => poly.p.trim().split(/\s+/))
    .map((pair) => pair.split(',').map(Number));

  assert.ok(points.length > 0, `${day} has no artwork`);

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

function insideHex(x, y) {
  let inside = false;
  for (let i = 0, j = HEX.length - 1; i < HEX.length; j = i++) {
    const [xi, yi] = HEX[i];
    const [xj, yj] = HEX[j];
    const crosses =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

test('every slot anchors inside the room', () => {
  const DECOR = decor();

  for (const day of DAYS) {
    const { x, y } = anchor(DECOR, day);
    assert.ok(insideHex(x, y), `${day} anchors outside the hexagon at ${x},${y}`);
  }
});

test('every slot anchors to its own patch of room', () => {
  const DECOR = decor();
  const seen = [];

  for (const day of DAYS) {
    const { x, y } = anchor(DECOR, day);
    const fraction = {
      x: (x - VIEW_BOX.x) / VIEW_BOX.width,
      y: (y - VIEW_BOX.y) / VIEW_BOX.height,
    };

    assert.ok(
      fraction.x > 0 && fraction.x < 1 && fraction.y > 0 && fraction.y < 1,
      `${day} anchors off the rendered box`,
    );

    for (const other of seen) {
      assert.ok(
        Math.hypot(other.x - x, other.y - y) > 40,
        `${day} anchors on top of another slot`,
      );
    }

    seen.push({ x, y });
  }
});
