import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEX_PITCH_Y,
  HEX_W,
  PYRAMID_CAPACITY,
  PYRAMID_ROWS,
  PYRAMID_SPAN,
  fitToViewport,
  pyramidBounds,
  slotAt,
} from './pyramidLayout.ts';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);

test('the first room is the apex, at the origin', () => {
  const slot = slotAt(0);
  assert.deepEqual(
    { pyramid: slot.pyramid, row: slot.row, col: slot.col },
    { pyramid: 0, row: 1, col: 0 },
  );
  close(slot.x, 0);
  close(slot.y, 0);
});

test('rows open at the triangular numbers', () => {
  const opens = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45];

  opens.forEach((index, i) => {
    const row = i + 1;
    assert.equal(slotAt(index).row, row, `index ${index} opens row ${row}`);
    assert.equal(slotAt(index).col, 0);
    if (index > 0) assert.equal(slotAt(index - 1).row, row - 1);
  });
});

test('a row is centred on the apex', () => {
  close(slotAt(1).x, -HEX_W / 2);
  close(slotAt(2).x, HEX_W / 2);

  close(slotAt(3).x, -HEX_W);
  close(slotAt(4).x, 0);
  close(slotAt(5).x, HEX_W);
});

test('rows step down by the honeycomb pitch, not the full hexagon', () => {
  for (let row = 1; row <= PYRAMID_ROWS; row += 1) {
    close(slotAt((row * (row - 1)) / 2).y, (row - 1) * HEX_PITCH_Y);
  }
});

test('every room touches the two below it', () => {
  for (let row = 1; row < PYRAMID_ROWS; row += 1) {
    for (let col = 0; col < row; col += 1) {
      const parent = slotAt((row * (row - 1)) / 2 + col);
      const below = [0, 1].map((step) =>
        slotAt((row * (row + 1)) / 2 + col + step),
      );

      below.forEach((child) => {
        close(Math.abs(child.x - parent.x), HEX_W / 2);
        close(child.y - parent.y, HEX_PITCH_Y);
      });
    }
  }
});

test('no two slots share a position', () => {
  const seen = new Set();

  for (let index = 0; index < PYRAMID_CAPACITY * 2; index += 1) {
    const { x, y } = slotAt(index);
    const key = `${x.toFixed(4)},${y.toFixed(4)}`;
    assert.ok(!seen.has(key), `index ${index} collides at ${key}`);
    seen.add(key);
  }
});

test('a full pyramid is ten rows of fifty-five rooms', () => {
  assert.equal(PYRAMID_CAPACITY, 55);
  assert.equal(slotAt(PYRAMID_CAPACITY - 1).row, PYRAMID_ROWS);
  assert.equal(slotAt(PYRAMID_CAPACITY - 1).col, PYRAMID_ROWS - 1);
});

test('room fifty-six starts a second pyramid, back at its apex', () => {
  const slot = slotAt(PYRAMID_CAPACITY);
  assert.deepEqual(
    { pyramid: slot.pyramid, row: slot.row, col: slot.col },
    { pyramid: 1, row: 1, col: 0 },
  );
  close(slot.x, PYRAMID_SPAN);
  close(slot.y, 0);
});

test('bounds track what is drawn, not the pyramid it belongs to', () => {
  // One room stands back far enough to see one room.
  const one = pyramidBounds(1);
  close(one.width, HEX_W);
  close(one.height, 360);

  // Three rooms is the apex plus the pair under it: two hexagons wide, and one
  // row's pitch taller than a single one.
  const three = pyramidBounds(3);
  close(three.width, HEX_W * 2);
  close(three.height, 360 + HEX_PITCH_Y);

  assert.ok(pyramidBounds(10).width > three.width);
});

test('bounds cover every slot they claim to', () => {
  const slots = PYRAMID_CAPACITY + 5;
  const bounds = pyramidBounds(slots);

  for (let index = 0; index < slots; index += 1) {
    const { x, y } = slotAt(index);
    assert.ok(x - HEX_W / 2 >= bounds.minX - 1e-9, `slot ${index} left`);
    assert.ok(x + HEX_W / 2 <= bounds.maxX + 1e-9, `slot ${index} right`);
    assert.ok(y - 180 >= bounds.minY - 1e-9, `slot ${index} top`);
    assert.ok(y + 180 <= bounds.maxY + 1e-9, `slot ${index} bottom`);
  }
});

test('fitting centres the pyramid in the viewport', () => {
  const bounds = pyramidBounds(PYRAMID_CAPACITY);
  const fit = fitToViewport(bounds, 390, 700, 24);

  const centreX = bounds.minX + bounds.width / 2;
  const centreY = bounds.minY + bounds.height / 2;
  close(fit.x + centreX * fit.scale, 195);
  close(fit.y + centreY * fit.scale, 350);

  assert.ok(bounds.width * fit.scale <= 390 - 48 + 1e-9);
  assert.ok(bounds.height * fit.scale <= 700 - 48 + 1e-9);
});
