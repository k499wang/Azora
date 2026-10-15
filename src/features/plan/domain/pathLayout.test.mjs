import assert from 'node:assert/strict';
import test from 'node:test';
import { pathWeekTrailNodes, pathDaySize } from './pathLayout.ts';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} should equal ${expected}`);
const week = (states) => ({ days: states.map((state, index) => ({ day: index + 1, state })) });

test('ordinary rows match native coin, padding, gap and room hex dimensions', () => {
  const nodes = pathWeekTrailNodes(week(['done', 'ahead']), false, 360);
  const half = 80 / 1.15 / 2;
  const row = 80 / 1.15 + 8;
  const roomHalf = 96 * (2 / Math.sqrt(3)) / 1.15 / 2;
  assert.equal(nodes.length, 3);
  near(nodes[0].y, 8 + half);
  near(nodes[1].y, 8 + row + 56 + half);
  near(nodes[2].y, 8 + (row + 56) * 2 + 8 + roomHalf);
  assert.deepEqual(nodes.map((node) => node.x), [180, 236, 180]);
  near(nodes[0].above, half);
  near(nodes[0].below, half + 8);
  assert.equal(nodes[0].reach, 40);
  assert.equal(nodes[2].reach, 48);
  near(nodes[2].above, roomHalf);
  near(nodes[2].below, roomHalf + 8);
});

test('today includes the larger coin and exactly its ring and speech bubble margins', () => {
  const day = { day: 1, state: 'today' };
  assert.equal(pathDaySize(day, false), 96);
  const [today, next] = pathWeekTrailNodes(week(['today', 'ahead']), false, 360);
  const half = 96 / 1.15 / 2;
  near(today.y, 8 + 12 + 24 + half);
  assert.equal(today.reach, 48 + 12);
  near(today.above, half + 12);
  near(today.below, half + 12 + 8);
  near(next.y, 8 + 12 + 24 + half * 2 + 8 + 12 + 56 + 80 / 1.15 / 2);
});

test('doneToday keeps the larger coin without today ring margins; locked rows use ordinary sizes', () => {
  const done = { day: 1, state: 'doneToday' };
  assert.equal(pathDaySize(done, false), 96);
  assert.equal(pathDaySize(done, true), 80);
  const [node] = pathWeekTrailNodes(week(['doneToday']), false, 360);
  near(node.y, 8 + 96 / 1.15 / 2);
  assert.equal(node.reach, 48);
  const locked = pathWeekTrailNodes(week(['today', 'doneToday']), true, 360);
  const ordinary = pathWeekTrailNodes(week(['ahead', 'done']), false, 360);
  assert.deepEqual(locked, ordinary);
});

test('resizing moves every centre horizontally and leaves rows and elliptical rims unchanged', () => {
  const calendar = week(['done', 'today', 'ahead', 'ahead', 'ahead', 'ahead', 'ahead']);
  const narrow = pathWeekTrailNodes(calendar, false, 320);
  const wide = pathWeekTrailNodes(calendar, false, 768);
  assert.deepEqual(wide, narrow.map((node) => ({ ...node, x: node.x + 224 })));
  assert.ok(wide.every((node) => Object.values(node).every(Number.isFinite)));
});
