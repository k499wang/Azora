import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FACE_ORIGIN_Y,
  getBreathingStage,
  STAGE_FLANK_INSET,
  STAGE_VIEWBOX_H,
} from './breathingStage';

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

test('the character is always too wide for the window it stands in', () => {
  for (const w of WINDOWS) {
    const stage = getBreathingStage(w.width, w.viewport);
    assert.ok(
      stage.width > w.width,
      `${w.name}: ${stage.width.toFixed(0)}pt stage in a ${w.width}pt window`,
    );
  }
});

test('the flat flanks sit on the screen edge, not inside it', () => {
  for (const w of WINDOWS) {
    const stage = getBreathingStage(w.width, w.viewport);
    // The stage is centred, so each flank sits this far outside the window.
    const clearance =
      (stage.width - w.width) / 2 - stage.width * STAGE_FLANK_INSET;
    assert.ok(
      clearance > -1,
      `${w.name}: flank is ${(-clearance).toFixed(1)}pt inside the edge`,
    );
  }
});

test('a tablet is sized by its width, exactly as a phone is', () => {
  for (const w of WINDOWS) {
    const stage = getBreathingStage(w.width, w.viewport);
    assert.ok(
      Math.abs(stage.width / w.width - 1.02) < 0.001,
      `${w.name} was capped by its height instead`,
    );
  }
});

test('the crown stays on screen and the base runs off the bottom', () => {
  for (const w of [...WINDOWS, LANDSCAPE]) {
    const stage = getBreathingStage(w.width, w.viewport);
    assert.ok(stage.top > 0, `${w.name} pushes the crown off the top`);
    assert.ok(
      stage.top + stage.height > w.viewport,
      `${w.name} shows the flat base`,
    );
  }
});

test('the face rests where the layout puts it, at every size', () => {
  for (const w of [...WINDOWS, LANDSCAPE]) {
    const stage = getBreathingStage(w.width, w.viewport);
    const face = stage.top + stage.height * (FACE_ORIGIN_Y / STAGE_VIEWBOX_H);
    assert.ok(
      Math.abs(face - w.viewport * 0.66) < 0.001,
      `${w.name} moved the face off its rest line`,
    );
  }
});
