import test from 'node:test';
import assert from 'node:assert/strict';
import { EYE_RADIUS, FACE_SHAPES, eyeOpenness, lerpFace } from './breathFaces.ts';

/**
 * The sessions coach a nasal inhale and an oral exhale. The face is the only
 * place the app shows that, so these pin it down: the mouth opens on exactly
 * one phase.
 */

test('the exhale is the only phase the mouth opens on', () => {
  for (const [face, shape] of Object.entries(FACE_SHAPES)) {
    assert.equal(
      shape.mouthBreath > 0,
      face === 'exhale',
      `${face} rides the breath open; air only leaves through the mouth`,
    );
  }
});

test('the inhale keeps the mouth sealed', () => {
  const { mouthTop, mouthBottom } = FACE_SHAPES.inhale;
  // The two edges of the lens sit within a hair of the lip line, so it reads as
  // a closed line rather than a gap.
  assert.ok(Math.abs(mouthTop) < 10, 'inhale mouth is open at the top');
  assert.ok(Math.abs(mouthBottom) < 10, 'inhale mouth is open at the bottom');
});

test('only the resting face uses tall rounded eyes', () => {
  const { resting, ...breathingFaces } = FACE_SHAPES;
  assert.equal(resting.eyeRoundness, 1);
  assert.equal(resting.eyeTop, -resting.eyeBottom);
  assert.equal(eyeOpenness(resting), 1);

  const squints = {
    inhale: [66, -38, -14],
    holdIn: [73, -46, -20],
    exhale: [66, -34, -12],
    holdOut: [62, -30, -11],
  };
  for (const [face, shape] of Object.entries(breathingFaces)) {
    assert.equal(shape.eyeRoundness, 0, `${face} eyes are rounded`);
    assert.deepEqual(
      [shape.eyeWidth, shape.eyeTop, shape.eyeBottom],
      squints[face],
      `${face} squint geometry changed`,
    );
  }
});

test('a squint reads as shut, never as a half-open eye', () => {
  const { resting, ...breathingFaces } = FACE_SHAPES;
  for (const [face, shape] of Object.entries(breathingFaces)) {
    // Both lids sit above the eye line, so the aperture is a closed arc rather
    // than a gap the iris could show through.
    assert.ok(shape.eyeTop < 0 && shape.eyeBottom < 0, `${face} eyes stay open`);
    assert.ok(
      eyeOpenness(shape) < 0.35,
      `${face} leaves the lids ${(eyeOpenness(shape) * 100).toFixed(0)}% open`,
    );
    assert.ok(shape.eyeWidth <= EYE_RADIUS * 1.1, `${face} squint is too wide`);
  }
});

test('a mouth is never pressed and blown open at once', () => {
  for (const [face, shape] of Object.entries(FACE_SHAPES)) {
    assert.ok(
      shape.mouthPress === 0 || shape.mouthBreath === 0,
      `${face} presses a mouth the breath is also opening`,
    );
  }
});

test('every part of a face morphs', () => {
  // A field added to FaceShape but missed in lerpFace snaps between phases
  // instead of travelling, and nothing else would catch it.
  const from = FACE_SHAPES.inhale;
  const to = FACE_SHAPES.resting;
  const mid = lerpFace(from, to, 0.5);

  for (const key of Object.keys(from)) {
    assert.ok(
      Math.abs(mid[key] - (from[key] + to[key]) / 2) < 1e-12,
      `lerpFace does not carry ${key}`,
    );
  }
});
