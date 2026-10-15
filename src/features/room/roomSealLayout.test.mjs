import assert from 'node:assert/strict';
import test from 'node:test';
import { sealLayout } from './roomSealLayout.ts';
import { ROOM_ASPECT } from './roomGeometry.ts';
import { decorationPickerLayout } from './decorationPickerLayout.ts';

/** the stage's box on an iPhone 13, as `DailyRewardFlow` reports it */
const from = { x: 20, y: 120, width: 350, scale: 0.9 };
const screen = { windowWidth: 390, windowHeight: 844, insetTop: 47 };

const centreY = from.y + (from.width * ROOM_ASPECT) / 2;

test('the room keeps the size the stage gave it, measured or not', () => {
  const before = sealLayout({ ...screen, trayHeight: 0, from });
  const after = sealLayout({ ...screen, trayHeight: 180, from });

  assert.equal(before.roomWidth, from.width * from.scale);
  assert.equal(after.roomWidth, before.roomWidth);
  assert.equal(before.measured, false);
  assert.equal(after.measured, true);
});

test('before the tray is measured the room stands exactly where the stage left it', () => {
  const { roomTop, roomHeight } = sealLayout({
    ...screen,
    trayHeight: 0,
    from,
    picking: false,
  });

  assert.ok(Math.abs(roomTop + roomHeight / 2 - centreY) < 0.01);
});

test('a room handed over never moves, measured or not', () => {
  const before = sealLayout({ ...screen, trayHeight: 0, from });
  const after = sealLayout({ ...screen, trayHeight: 500, from });

  assert.equal(after.roomTop, before.roomTop);
  assert.equal(after.roomWidth, before.roomWidth);
  assert.ok(Math.abs(after.roomTop + after.roomHeight / 2 - centreY) < 0.01);
});

test('with nothing handed over the room centres in what the tray leaves', () => {
  const { roomTop, roomHeight, free } = sealLayout({
    ...screen,
    trayHeight: 200,
    from: null,
  });

  assert.ok(
    Math.abs(roomTop - (screen.insetTop + 16 + (free - roomHeight) / 2)) < 0.01,
  );
  assert.ok(roomTop >= screen.insetTop);
  assert.ok(roomTop + roomHeight <= screen.windowHeight - 200);
});

test('the seal keeps the room clear of its own tray', () => {
  const { roomTop, roomHeight } = sealLayout({
    ...screen,
    trayHeight: 200,
    from,
  });

  // The matching trays leave the handed-over room the same space above them.
  assert.ok(roomTop + roomHeight <= screen.windowHeight - 200);
});

test('with no stage to arrive from the room still fits the screen', () => {
  const { roomWidth, roomHeight } = sealLayout({
    ...screen,
    trayHeight: 200,
    from: null,
    picking: false,
  });

  assert.ok(roomWidth > 0);
  assert.ok(roomWidth <= screen.windowWidth);
  assert.ok(roomHeight <= screen.windowHeight - screen.insetTop);
});

test('standalone rooms fit above the full picker-height tray on short phones', () => {
  for (const device of [
    { windowWidth: 320, windowHeight: 568, insetTop: 20, insetBottom: 0 },
    { windowWidth: 375, windowHeight: 667, insetTop: 20, insetBottom: 0 },
    { windowWidth: 360, windowHeight: 640, insetTop: 24, insetBottom: 0 },
    { windowWidth: 390, windowHeight: 844, insetTop: 47, insetBottom: 34 },
  ]) {
    const { rowHeight } = decorationPickerLayout(device.windowWidth, 18, 1.25);
    // The native button's 60pt box, plus the tray's padding and row gap.
    const trayHeight = rowHeight + 60 + 16 + 8 + Math.max(device.insetBottom, 16);
    const layout = sealLayout({ ...device, trayHeight, from: null });

    assert.ok(layout.roomTop >= device.insetTop, `safe area at width ${device.windowWidth}`);
    assert.ok(
      layout.roomTop + layout.roomHeight <= device.windowHeight - trayHeight,
      `tray at width ${device.windowWidth}`,
    );
    assert.ok(layout.roomHeight <= layout.free + 0.001);
  }
});

test('the room is one box for the whole seal, replay and picker alike', () => {
  const input = { ...screen, trayHeight: 200, from };

  assert.deepEqual(sealLayout(input), sealLayout(input));
  assert.equal(sealLayout(input).roomWidth, from.width * from.scale);
});
