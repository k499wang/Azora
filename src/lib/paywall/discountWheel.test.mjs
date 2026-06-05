import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiscountSegments,
  resolveTargetRotation,
  segmentCenterAngle,
  segmentIndexAtPointer,
  segmentSweepAngle,
} from './discountWheel.ts';

test('segments evenly divide the circle', () => {
  assert.equal(segmentSweepAngle(4), 90);
  assert.equal(segmentSweepAngle(6), 60);
});

test('segment centers are offset by half a wedge', () => {
  assert.equal(segmentCenterAngle(0, 4), 45);
  assert.equal(segmentCenterAngle(3, 4), 315);
});

test('rotation lands the requested segment under the pointer', () => {
  const segmentCount = 6;
  for (let winningIndex = 0; winningIndex < segmentCount; winningIndex++) {
    const rotation = resolveTargetRotation({
      winningIndex,
      segmentCount,
      currentRotation: 0,
    });
    assert.equal(segmentIndexAtPointer(rotation, segmentCount), winningIndex);
  }
});

test('landing holds within the wedge across the jitter range', () => {
  const segmentCount = 5;
  for (const landingOffset of [-0.99, -0.5, 0, 0.5, 0.99]) {
    const rotation = resolveTargetRotation({
      winningIndex: 2,
      segmentCount,
      currentRotation: 0,
      landingOffset,
    });
    assert.equal(segmentIndexAtPointer(rotation, segmentCount), 2);
  }
});

test('wheel always spins forward from its current rotation', () => {
  const currentRotation = 1234;
  const rotation = resolveTargetRotation({
    winningIndex: 1,
    segmentCount: 4,
    currentRotation,
    fullTurns: 3,
  });
  assert.ok(rotation > currentRotation);
  assert.ok(rotation - currentRotation >= 3 * 360);
  assert.equal(segmentIndexAtPointer(rotation, 4), 1);
});

test('discount segments always include the real percent as the winner', () => {
  const { segments, winningId } = buildDiscountSegments(50);
  assert.equal(winningId, 'pct-50');
  assert.ok(segments.some((s) => s.id === winningId));
  assert.equal(segments.length, 6);
});

test('discount segments mix values above and below the win', () => {
  const { segments } = buildDiscountSegments(50);
  const percents = segments.map((s) => Number(s.id.replace('pct-', '')));
  assert.ok(percents.some((p) => p > 50), 'expected a higher decoy');
  assert.ok(percents.some((p) => p < 50), 'expected a lower decoy');
});

test('discount segments stay within sane bounds and stay distinct', () => {
  const { segments } = buildDiscountSegments(85);
  const percents = segments.map((s) => Number(s.id.replace('pct-', '')));
  assert.equal(new Set(percents).size, percents.length);
  assert.ok(percents.every((p) => p >= 5 && p <= 90));
});

test('fullTurns adds whole rotations without changing the landing', () => {
  const few = resolveTargetRotation({
    winningIndex: 2,
    segmentCount: 4,
    currentRotation: 0,
    fullTurns: 2,
  });
  const many = resolveTargetRotation({
    winningIndex: 2,
    segmentCount: 4,
    currentRotation: 0,
    fullTurns: 7,
  });
  assert.equal((many - few) % 360, 0);
  assert.equal(segmentIndexAtPointer(few, 4), 2);
  assert.equal(segmentIndexAtPointer(many, 4), 2);
});
