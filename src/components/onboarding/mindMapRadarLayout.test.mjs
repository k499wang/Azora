import assert from 'node:assert/strict';
import test from 'node:test';

import { getRadarLayout } from './mindMapRadarLayout';

const AXES = 5;

/** Logical portrait widths. The radar is handed the window's own width. */
const PHONES = [375, 390, 393, 402, 412, 414, 430, 440];
const TABLETS = [744, 752, 800];

function chipRects(layout) {
  return layout.chips.map((chip) => ({
    left: chip.left,
    right: chip.left + layout.chipWidth,
    top: chip.top,
    bottom: chip.top + layout.chipHeight,
  }));
}

function overlaps(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function contains(rect, point) {
  return (
    point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom
  );
}

test('every chip stays inside the canvas', () => {
  for (const size of [...PHONES, ...TABLETS]) {
    const layout = getRadarLayout(size, AXES);
    for (const rect of chipRects(layout)) {
      assert.ok(rect.left >= 0 && rect.right <= size, `${size}pt chip runs off the side`);
      assert.ok(rect.top >= 0 && rect.bottom <= layout.height, `${size}pt chip leaves the box`);
    }
  }
});

test('no chip covers another chip or a vertex', () => {
  for (const size of [...PHONES, ...TABLETS]) {
    const layout = getRadarLayout(size, AXES);
    const rects = chipRects(layout);
    rects.forEach((rect, i) => {
      rects.slice(i + 1).forEach((other) => {
        assert.ok(!overlaps(rect, other), `${size}pt chips ${i} overlap`);
      });
      layout.vertices.forEach((vertex) => {
        assert.ok(!contains(rect, vertex), `${size}pt chip ${i} covers a vertex`);
      });
    });
  }
});

function insidePolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > point.y !== b.y > point.y) {
      const crossX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
      if (point.x < crossX) inside = !inside;
    }
  }
  return inside;
}

/** Points around a chip's edge, pushed out by the frame's half-stroke. */
function outline(rect, pad) {
  const points = [];
  for (let t = 0; t <= 1; t += 0.1) {
    const x = rect.left + (rect.right - rect.left) * t;
    const y = rect.top + (rect.bottom - rect.top) * t;
    points.push({ x, y: rect.top - pad }, { x, y: rect.bottom + pad });
    points.push({ x: rect.left - pad, y }, { x: rect.right + pad, y });
  }
  return points;
}

test('no chip sits on the pentagon', () => {
  for (const size of [...PHONES, ...TABLETS]) {
    const layout = getRadarLayout(size, AXES);
    chipRects(layout).forEach((rect, i) => {
      for (const point of outline(rect, 2 * layout.scale)) {
        assert.ok(!insidePolygon(point, layout.vertices), `${size}pt chip ${i} overlaps the pentagon`);
      }
    });
  }
});

test('a phone gets a pentagon big enough to read', () => {
  for (const size of PHONES) {
    const layout = getRadarLayout(size, AXES);
    assert.equal(layout.scale, 1, `${size}pt scaled like a tablet`);
    assert.ok(layout.radius >= 110, `${size}pt radar is only ${layout.radius}pt`);
  }
});

test('a tablet grows the radar instead of centring a phone-sized one', () => {
  const phone = getRadarLayout(390, AXES);
  for (const size of TABLETS) {
    const layout = getRadarLayout(size, AXES);
    assert.ok(layout.radius > phone.radius * 1.4, `${size}pt radar is only ${layout.radius}pt`);
    assert.ok(layout.scale > 1, `${size}pt chips stayed phone-sized`);
  }
});
