import assert from 'node:assert/strict';
import test from 'node:test';

import { ROOM_MAX_WIDTH, getRoomWidth } from './roomLayout';
import { ROOM_ASPECT } from './roomGeometry';

/**
 * The tallest room screen is the room-complete screen: a two-line title, a
 * two-line note, a footer button and the scrolling tail. This covers the
 * first paint; `useRoomWidth` measures the real space once the layout has it.
 */
const ROOM_SCREEN_CHROME = 364;

const DEVICES = [
  { name: 'iPhone SE (1st gen)', width: 320, height: 568 },
  { name: 'iPhone SE 2/3', width: 375, height: 667 },
  { name: 'iPhone 13 mini', width: 375, height: 812 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 15/16', width: 393, height: 852 },
  { name: 'iPhone 11/XR', width: 414, height: 896 },
  { name: 'iPhone 15 Pro Max', width: 430, height: 932 },
  { name: 'iPad mini', width: 744, height: 1133 },
  { name: 'iPad Pro 12.9', width: 1024, height: 1366 },
  { name: 'Android small', width: 360, height: 640 },
  { name: 'Galaxy S21', width: 360, height: 800 },
  { name: 'Pixel 7', width: 412, height: 915 },
  { name: 'Android tablet', width: 800, height: 1280 },
];

test('a finished room fits its screen without scrolling, on every device', () => {
  for (const d of DEVICES) {
    const height = getRoomWidth(d.width, d.height) * ROOM_ASPECT;
    assert.ok(
      height <= d.height - ROOM_SCREEN_CHROME + 0.001,
      `${d.name}: room is ${height.toFixed(0)}pt with only ` +
        `${(d.height - ROOM_SCREEN_CHROME).toFixed(0)}pt for it`,
    );
  }
});

test('the room still fits the screen width with its gutters', () => {
  for (const d of DEVICES) {
    assert.ok(getRoomWidth(d.width, d.height) <= d.width - 36, d.name);
  }
});

/** what the width-only formula drew, before the height clamp existed */
const widthOnly = (w) => Math.min(w - 36, ROOM_MAX_WIDTH);

test('phones with the headroom draw exactly what they drew before', () => {
  for (const d of DEVICES) {
    const hadRoom = widthOnly(d.width) * ROOM_ASPECT <= d.height - ROOM_SCREEN_CHROME;
    if (!hadRoom) continue;
    assert.equal(
      getRoomWidth(d.width, d.height),
      widthOnly(d.width),
      `${d.name} must not move`,
    );
  }
});

test('only screens that could not fit the room shrank', () => {
  const shrunk = DEVICES.filter(
    (d) => getRoomWidth(d.width, d.height) < widthOnly(d.width) - 0.001,
  ).map((d) => d.name);
  assert.deepEqual(shrunk, [
    'iPhone SE (1st gen)',
    'iPhone SE 2/3',
    'Android small',
  ]);
});

/**
 * The floor is what the shortest screen physically leaves, not a taste call: a
 * 568pt phone has ~204pt for the room once the tallest chrome is paid for. This
 * only guards the first paint — the measured width is usually larger, because
 * most screens spend less than the worst case.
 */
test('even the shortest screen still gets a room, not a thumbnail', () => {
  const smallest = Math.min(
    ...DEVICES.map((d) => getRoomWidth(d.width, d.height)),
  );
  assert.ok(smallest > 170, `smallest room is ${smallest.toFixed(0)}pt`);
});
