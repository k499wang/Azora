import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EYE_RADIUS,
  FACE_SHAPES,
  LID_CURVE,
  LID_THICKNESS,
  LID_WIDTH,
  eyeOpenness,
  lerpFace,
} from './breathFaces.ts';

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

test('a sealed mouth is a shut curve, not a drawn line', () => {
  for (const [face, shape] of Object.entries(FACE_SHAPES)) {
    if (shape.mouthBreath > 0) continue;
    // Both edges on the same side of the lip line make an arc of constant
    // thickness — shut, but still curved, and thin enough to read as lips
    // meeting rather than as a gap.
    assert.ok(
      shape.mouthTop > 0 && shape.mouthBottom > shape.mouthTop,
      `${face} mouth is a flat lens rather than a curve`,
    );
    assert.ok(
      shape.mouthBottom - shape.mouthTop < 26,
      `${face} mouth is open`,
    );
  }
});

test('only the resting face uses tall rounded eyes', () => {
  const { resting, ...breathingFaces } = FACE_SHAPES;
  assert.equal(resting.eyeRoundness, 1);
  assert.equal(resting.eyeTop, -resting.eyeBottom);
  assert.equal(eyeOpenness(resting), 1);

  // Every phase is the one shut lid: same width, same thickness, same curve.
  // A lid that thickened or straightened between phases would read as the eye
  // reopening a little on each breath.
  for (const [face, shape] of Object.entries(breathingFaces)) {
    assert.equal(shape.eyeRoundness, 0, `${face} eyes are rounded`);
    assert.equal(shape.eyeWidth, LID_WIDTH, `${face} lid changed width`);
    assert.equal(
      shape.eyeBottom - shape.eyeTop,
      LID_THICKNESS,
      `${face} lid changed thickness`,
    );
    assert.equal(shape.eyeTop, LID_CURVE, `${face} lid changed curve`);
  }
});

test('a squint reads as shut, never as a half-open eye', () => {
  const { resting, ...breathingFaces } = FACE_SHAPES;
  for (const [face, shape] of Object.entries(breathingFaces)) {
    // Both lids sit below the eye line, so the aperture is a closed arc
    // hanging downward rather than a gap the iris could show through.
    assert.ok(shape.eyeTop > 0 && shape.eyeBottom > 0, `${face} eyes stay open`);
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
