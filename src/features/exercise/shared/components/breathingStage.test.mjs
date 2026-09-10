import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BREATH_RISE_RATIO,
  CROWN_Y,
  FACE_ORIGIN_Y,
  FACE_REST_RATIO,
  INSEAM_Y,
  NECK_STRETCH_RATIO,
  getBreathingStage,
  HEAD_LEFT_X,
  HEAD_RIGHT_X,
  STAGE_VIEWBOX_H,
  STAGE_VIEWBOX_W,
} from './breathingStage.ts';

/**
 * Logical portrait sizes with the top inset already taken off, which is the
 * viewport the scaffold hands the character. The app is portrait-locked, but an
 * iPad window can still be short and wide, so one landscape shape is here too.
 */
const WINDOWS = [
  { name: 'iPhone SE 2/3', width: 375, viewport: 647 },
  { name: 'iPhone 13 mini', width: 375, viewport: 765 },
  { name: 'iPhone 15', width: 393, viewport: 793 },
  { name: 'iPhone 15 Pro Max', width: 430, viewport: 873 },
  { name: 'Galaxy S21', width: 360, viewport: 776 },
  { name: 'iPad mini', width: 744, viewport: 1109 },
  { name: 'iPad Pro 12.9', width: 1024, viewport: 1342 },
  { name: 'Android tablet', width: 800, viewport: 1256 },
];

const LANDSCAPE = { name: 'iPad mini landscape', width: 1133, viewport: 720 };

test('he is drawn whole, and stands low enough to hide his legs', () => {
  // The pose is never redrawn shorter — the session shows his upper body only
  // because everything below the belly is past the bottom edge. If this fails,
  // a window is showing the notch between his feet.
  for (const w of [...WINDOWS, LANDSCAPE]) {
    const stage = getBreathingStage(w.width, w.viewport);
    // Measured at the top of an inhale, when the drift has pulled him up as far
    // as he ever goes.
    const inseam =
      stage.top +
      stage.height * (INSEAM_Y / STAGE_VIEWBOX_H) -
      w.viewport * BREATH_RISE_RATIO;
    assert.ok(
      inseam > w.viewport,
      `${w.name}: a full inhale parts his legs ${(w.viewport - inseam).toFixed(0)}pt above the bottom edge`,
    );
  }
});

test('the head reads large without swallowing the window', () => {
  // The ears reach wider than the head and are meant to run off the sides; the
  // head itself keeps air either side of it.
  for (const w of WINDOWS.slice(0, 5)) {
    const stage = getBreathingStage(w.width, w.viewport);
    const share = ((HEAD_RIGHT_X - HEAD_LEFT_X) / STAGE_VIEWBOX_W) * stage.width / w.width;
    assert.ok(
      share > 0.8 && share < 0.95,
      `${w.name}: the head takes ${(share * 100).toFixed(0)}% of the window`,
    );
  }
});

test('the crown stays on screen and the chest runs off the bottom', () => {
  for (const w of [...WINDOWS, LANDSCAPE]) {
    const stage = getBreathingStage(w.width, w.viewport);
    const crown = stage.top + stage.height * (CROWN_Y / STAGE_VIEWBOX_H);
    assert.ok(crown > 0, `${w.name} pushes the ears off the top`);
    assert.ok(
      stage.top + stage.height > w.viewport,
      `${w.name} shows the base of the chest`,
    );
  }
});

test('a full inhale never pushes the ears off the top', () => {
  // The head spends the drift and the neck stretch together, and the ears ride
  // the head. Whatever those two cost has to come out of the gap above the
  // crown, at the smallest window that gap ever is.
  for (const w of [...WINDOWS, LANDSCAPE]) {
    const stage = getBreathingStage(w.width, w.viewport);
    const crown =
      stage.top +
      stage.height * (CROWN_Y / STAGE_VIEWBOX_H) -
      w.viewport * BREATH_RISE_RATIO -
      stage.height * NECK_STRETCH_RATIO;
    assert.ok(crown > 0, `${w.name}: a full inhale lifts the ears off the top`);
  }
});

test('the eyes rest where the layout puts them, at every size', () => {
  for (const w of [...WINDOWS, LANDSCAPE]) {
    const stage = getBreathingStage(w.width, w.viewport);
    const eyes = stage.top + stage.height * (FACE_ORIGIN_Y / STAGE_VIEWBOX_H);
    assert.ok(
      Math.abs(eyes - w.viewport * FACE_REST_RATIO) < 0.001,
      `${w.name} moved the eyes off their rest line`,
    );
  }
});

test('a wide window never draws a head bigger than the viewport allows', () => {
  for (const w of [...WINDOWS, LANDSCAPE]) {
    const stage = getBreathingStage(w.width, w.viewport);
    assert.ok(
      stage.width <= w.viewport * 1.05 + 0.001,
      `${w.name} ignored the viewport cap`,
    );
  }
});
