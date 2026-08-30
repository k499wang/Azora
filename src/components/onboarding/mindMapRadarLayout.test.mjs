import assert from 'node:assert/strict';
import test from 'node:test';

import { getRadarLayout } from './mindMapRadarLayout';

const AXES = 5;

/** Logical portrait widths. The radar is handed the window's own width. */
const PHONES = [320, 360, 375, 390, 393, 412, 414, 430, 440];
const TABLETS = [744, 752, 800];

test('a phone draws exactly the radar it drew before', () => {
  for (const size of PHONES) {
    const layout = getRadarLayout(size, AXES);
    assert.equal(layout.radius, 120, `${size}pt radius moved`);
    assert.equal(layout.labelWidth, 84, `${size}pt label width moved`);
    assert.equal(layout.ink, 1, `${size}pt stroke weight moved`);
    assert.equal(layout.boxHeight, size - 40, `${size}pt box moved`);
    assert.equal(layout.boxTop, -20, `${size}pt offset moved`);
  }
});

test('a tablet grows the radar instead of centring a phone-sized one', () => {
  for (const size of TABLETS) {
    const layout = getRadarLayout(size, AXES);
    assert.ok(layout.radius > 160, `${size}pt radar is only ${layout.radius}pt`);
    assert.ok(layout.ink > 1.3, `${size}pt strokes stayed thin`);
  }
});

test('the grown radar keeps every label on the canvas', () => {
  for (const size of [...PHONES, ...TABLETS]) {
    const layout = getRadarLayout(size, AXES);
    if (layout.radius === 120) continue;
    // cos(18°) is the widest axis of a five-sided radar.
    const widest = Math.cos((18 * Math.PI) / 180);
    const labelRight =
      size / 2 + (layout.radius + 20) * widest + layout.labelWidth;
    assert.ok(labelRight <= size + 0.5, `${size}pt clips its labels`);
  }
});

test('the pentagon stops short of the space around it', () => {
  for (const size of TABLETS) {
    const layout = getRadarLayout(size, AXES);
    const widest = Math.cos((18 * Math.PI) / 180);
    const drawnHalf = (layout.radius + 20) * widest + layout.labelWidth;
    assert.ok(
      size / 2 - drawnHalf > 24,
      `${size}pt leaves only ${(size / 2 - drawnHalf).toFixed(0)}pt of margin`,
    );
  }
});

/**
 * Where the component actually puts a label, in canvas coordinates: lifted half
 * a line over its vertex, the upper ones nudged further, then a title that may
 * wrap and its value below it.
 */
function drawnBand(size, layout, axes) {
  const ring = layout.radius + 20;
  const lift = Math.round(18 * layout.textScale);
  const nudge = Math.round(20 * layout.textScale);
  const body = Math.round(18 * layout.textScale) * 2 + Math.round(14 * layout.textScale);
  let top = Infinity;
  let bottom = -Infinity;

  for (let i = 0; i < axes; i += 1) {
    const y = size / 2 + ring * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / axes);
    top = Math.min(top, y - lift - nudge);
    bottom = Math.max(bottom, y - lift + body);
  }

  return { top, bottom };
}

test('the box holds every label, with the same clearance at both ends', () => {
  for (const size of TABLETS) {
    const layout = getRadarLayout(size, AXES);
    const band = drawnBand(size, layout, AXES);
    const above = band.top + layout.boxTop;
    const below = layout.boxHeight - (band.bottom + layout.boxTop);

    assert.ok(above >= 28, `${size}pt leaves ${above.toFixed(0)}pt above the radar`);
    assert.ok(below >= 28, `${size}pt leaves ${below.toFixed(0)}pt below the radar`);
    assert.ok(
      Math.abs(above - below) <= 4,
      `${size}pt is lopsided: ${above.toFixed(0)}pt above, ${below.toFixed(0)}pt below`,
    );
  }
});

test('the pentagon itself never rides out of its box', () => {
  for (const size of TABLETS) {
    const layout = getRadarLayout(size, AXES);
    const top = size / 2 - layout.radius + layout.boxTop;
    const bottom =
      size / 2 + layout.radius * Math.sin((54 * Math.PI) / 180) + layout.boxTop;

    assert.ok(top >= 0, `${size}pt clips the top vertex`);
    assert.ok(bottom <= layout.boxHeight, `${size}pt clips the lower vertices`);
  }
});
