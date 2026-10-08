import assert from 'node:assert/strict';
import test from 'node:test';
import { trailDots, trailStretches } from './pathTrail';

const coin = (x, y) => ({ x, y, reach: 40, above: 35, below: 43 });

test('a stretch turns gold only between two gold coins', () => {
  assert.deepEqual(
    trailStretches([true, true, true, true, false], [true, true, false, true]),
    ['walked', 'gold', 'walked', 'walked', 'ahead'],
  );
  assert.deepEqual(trailStretches([true, true], [false, true]), ['walked', 'walked']);
});

test('dots sit on the straight line between the two rims, evenly spaced', () => {
  const from = coin(0, 0);
  const to = coin(48, 110);
  const dots = trailDots(from, to, 16, 8);
  assert.ok(dots.length >= 2);
  const slope = 110 / 48;
  for (const dot of dots) assert.ok(Math.abs(dot.y / dot.x - slope) < 1e-9);
  const gaps = dots.slice(1).map((dot, index) => Math.hypot(dot.x - dots[index].x, dot.y - dots[index].y));
  for (const gap of gaps) assert.ok(Math.abs(gap - gaps[0]) < 1e-9);
  const inside = (point, node, ry) => ((point.x - node.x) / node.reach) ** 2 + ((point.y - node.y) / ry) ** 2 < 1;
  for (const dot of dots) {
    assert.equal(inside(dot, from, from.below), false);
    assert.equal(inside(dot, to, to.above), false);
  }
});

test('a gap too short for a full step gets one centred dot, and overlapping coins none', () => {
  const dots = trailDots(coin(0, 0), coin(0, 100), 16, 8);
  assert.equal(dots.length, 1);
  assert.equal(dots[0].x, 0);
  assert.ok(Math.abs(dots[0].y - (43 + 100 - 35) / 2) < 1e-9);
  assert.deepEqual(trailDots(coin(0, 0), coin(0, 60), 16, 8), []);
  assert.deepEqual(trailDots(coin(0, 0), coin(0, 0), 16, 8), []);
});
