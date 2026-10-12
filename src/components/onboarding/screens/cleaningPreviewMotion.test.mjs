import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLEANING_PREVIEW_TIMELINE as timeline,
  getCleaningPinEndpoints,
  getCleaningPinPosition,
  getCleaningWipeWidth,
} from './cleaningPreviewMotion.ts';

test('a pin travels from its photo area to the matching measured card badge', () => {
  const endpoints = getCleaningPinEndpoints(
    { x: 0.56, y: 0.54 },
    { x: 8, y: 12, width: 320, height: 200 },
    { x: 8, y: 228, width: 320, height: 168 },
    { x: 0, y: 56, width: 320, height: 52 },
    { x: 12, y: 14, width: 24, height: 24 },
  );
  assert.deepEqual(endpoints.start, { x: 8 + 0.56 * 320, y: 120 });
  assert.deepEqual(endpoints.end, { x: 32, y: 310 });
});

test('the pin origin follows the photo size and each card has its own destination', () => {
  const destinations = [];
  for (const photoWidth of [272, 342, 380]) {
    const photo = { x: 0, y: 0, width: photoWidth, height: photoWidth * 432 / 694 };
    const plan = { x: 0, y: photo.height + 16, width: photoWidth, height: 180 };
    for (let index = 0; index < 3; index += 1) {
      const endpoints = getCleaningPinEndpoints(
        { x: 0.5, y: 0.5 },
        photo,
        plan,
        { x: 0, y: index * 60, width: photoWidth, height: 52 },
        { x: 12, y: 14, width: 24, height: 24 },
      );
      assert.equal(endpoints.start.x, photoWidth / 2);
      assert.equal(endpoints.start.y, photo.height / 2);
      assert.equal(endpoints.end.y, plan.y + index * 60 + 26);
      destinations.push(endpoints.end.y);
    }
  }
  assert.equal(new Set(destinations).size, 9);
});

test('pin travel lands exactly on its destination without overshooting on replay or completion', () => {
  const start = { x: 200, y: 100 };
  const end = { x: 24, y: 320 };
  assert.deepEqual(getCleaningPinPosition(-1, start, end), start);
  assert.deepEqual(getCleaningPinPosition(0, start, end), start);
  const halfway = getCleaningPinPosition(0.5, start, end);
  assert.equal(halfway.x, 112);
  assert.ok(halfway.y < 210, 'the pin arcs above a straight-line path');
  for (const progress of [1, 2]) {
    const position = getCleaningPinPosition(progress, start, end);
    assert.equal(position.x, end.x);
    assert.ok(Math.abs(position.y - end.y) < 1e-9);
  }
});

test('the before/after wipe reveals the full photo without changing its size', () => {
  for (const width of [0, 272, 342, 380]) {
    assert.equal(getCleaningWipeWidth(0, width), 0);
    assert.equal(getCleaningWipeWidth(timeline.wipeStart, width), 0);
    assert.equal(getCleaningWipeWidth((timeline.wipeStart + timeline.wipeEnd) / 2, width), width / 2);
    assert.equal(getCleaningWipeWidth(timeline.wipeEnd, width), width);
    assert.equal(getCleaningWipeWidth(timeline.total + 1000, width), width);
  }
});
