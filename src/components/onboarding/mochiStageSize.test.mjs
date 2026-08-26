import assert from 'node:assert/strict';
import test from 'node:test';

import { getMochiStageWidth } from './mochiStageSize';
import { ROOM_ASPECT } from '../../features/room/roomGeometry';

/**
 * Logical portrait sizes. The app is portrait-locked, so these are every shape
 * the room has to land in. `wasWidth` is what the width-only sizing drew, kept
 * so a regression on a roomy phone fails loudly rather than quietly.
 */
const DEVICES = [
  { name: 'iPhone SE (1st gen)', width: 320, height: 568, wasWidth: 272 },
  { name: 'iPhone SE 2/3', width: 375, height: 667, wasWidth: 327 },
  { name: 'iPhone 13 mini', width: 375, height: 812, wasWidth: 327 },
  { name: 'iPhone 12/13/14', width: 390, height: 844, wasWidth: 330 },
  { name: 'iPhone 15/16', width: 393, height: 852, wasWidth: 330 },
  { name: 'iPhone 11/XR', width: 414, height: 896, wasWidth: 330 },
  { name: 'iPhone 15 Pro Max', width: 430, height: 932, wasWidth: 330 },
  { name: 'iPhone 16 Pro Max', width: 440, height: 956, wasWidth: 330 },
  { name: 'iPad mini', width: 744, height: 1133, wasWidth: 330 },
  { name: 'iPad Pro 12.9', width: 1024, height: 1366, wasWidth: 330 },
  { name: 'Galaxy Fold (outer)', width: 320, height: 747, wasWidth: 272 },
  { name: 'Android small', width: 360, height: 640, wasWidth: 312 },
  { name: 'Galaxy S21', width: 360, height: 800, wasWidth: 312 },
  { name: 'Pixel 4a', width: 393, height: 851, wasWidth: 330 },
  { name: 'Pixel 7', width: 412, height: 915, wasWidth: 330 },
  { name: 'Android tablet', width: 800, height: 1280, wasWidth: 330 },
];

const HEIGHT_SHARE = 0.46;

test('the room never takes more than its share of any screen height', () => {
  for (const d of DEVICES) {
    const height = getMochiStageWidth(d.width, d.height) * ROOM_ASPECT;
    assert.ok(
      height <= d.height * HEIGHT_SHARE + 0.001,
      `${d.name}: room is ${height.toFixed(0)}pt of ${d.height}pt`,
    );
  }
});

test('the room always fits the screen width with its gutters', () => {
  for (const d of DEVICES) {
    assert.ok(
      getMochiStageWidth(d.width, d.height) <= d.width - 48,
      `${d.name} overflows its gutters`,
    );
  }
});

test('only screens that were over budget changed', () => {
  for (const d of DEVICES) {
    const width = getMochiStageWidth(d.width, d.height);
    const wasOverBudget = d.wasWidth * ROOM_ASPECT > d.height * HEIGHT_SHARE;
    if (wasOverBudget) {
      assert.ok(width < d.wasWidth, `${d.name} should have shrunk`);
    } else {
      assert.equal(width, d.wasWidth, `${d.name} must not move`);
    }
  }
});

test('the room stays big enough to read as a room on the smallest screen', () => {
  const smallest = Math.min(
    ...DEVICES.map((d) => getMochiStageWidth(d.width, d.height)),
  );
  assert.ok(smallest > 200, `smallest room is ${smallest.toFixed(0)}pt`);
});
