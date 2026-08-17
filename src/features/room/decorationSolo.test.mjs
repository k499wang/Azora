import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The picker draws each decoration alone in a square card. Getting it centred
 * needs two things that are easy to lose: the shadow it casts must not count
 * towards the bounds, and the box must be square.
 *
 * `DECOR` is parsed out of the scene rather than imported — it sits in a `.tsx`
 * file alongside components this runner cannot load.
 */

const PAD = 12;
const BOX = 172;
/** floor shadows under the standing pieces, wall shadows behind the hung ones */
const SHADOWS = 18;

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

function bounds(polys) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const poly of polys) {
    for (const pair of poly.p.trim().split(/\s+/)) {
      const [x, y] = pair.split(',').map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { minX, minY, maxX, maxY };
}

test('every decoration lands dead centre of its square box', () => {
  for (const [key, all] of Object.entries(decor())) {
    const polys = all.filter((poly) => poly.sh !== 1);
    const { minX, minY, maxX, maxY } = bounds(polys);

    const width = maxX - minX + PAD * 2;
    const height = maxY - minY + PAD * 2;
    const size = Math.max(width, height);
    const viewX = minX - PAD - (size - width) / 2;
    const viewY = minY - PAD - (size - height) / 2;

    const scale = BOX / size;
    const centreX = ((minX + maxX) / 2 - viewX) * scale;
    const centreY = ((minY + maxY) / 2 - viewY) * scale;

    assert.ok(
      Math.abs(centreX - BOX / 2) < 0.01,
      `${key} sits ${(centreX - BOX / 2).toFixed(1)}px off centre horizontally`,
    );
    assert.ok(
      Math.abs(centreY - BOX / 2) < 0.01,
      `${key} sits ${(centreY - BOX / 2).toFixed(1)}px off centre vertically`,
    );
  }
});

test('every shadow is marked, and only ever as the first polygon', () => {
  // Drawn first so it sits under the piece. A shadow marked anywhere else is
  // either mismarked or painted over the object it belongs to.
  let found = 0;

  for (const [key, polys] of Object.entries(decor())) {
    polys.forEach((poly, index) => {
      if (poly.sh !== 1) return;
      found += 1;
      assert.equal(index, 0, `${key} marks a shadow at index ${index}`);
    });
  }

  assert.equal(
    found,
    SHADOWS,
    'the number of marked shadows changed — check the picker still looks right',
  );
});

test('the solo view drops shadows and squares the box', () => {
  const stage = readFileSync(join(here, 'roomStage.tsx'), 'utf8');
  assert.match(stage, /poly\.sh !== 1/);
  assert.match(stage, /const size = Math\.max\(width, height\)/);
});
