import assert from 'node:assert/strict';
import test from 'node:test';
import { sealLayout } from './roomSealLayout.ts';
import { ROOM_ASPECT } from './roomGeometry.ts';

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
  const after = sealLayout({ ...screen, trayHeight: 200, from });

  assert.equal(after.roomTop, before.roomTop);
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

  // The stage's sheet is taller than this tray, so a room that fitted above
  // the sheet fits above the tray with room to spare.
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

test('the room is one box for the whole seal, replay and picker alike', () => {
  const input = { ...screen, trayHeight: 200, from };

  assert.deepEqual(sealLayout(input), sealLayout(input));
  assert.equal(sealLayout(input).roomWidth, from.width * from.scale);
});
