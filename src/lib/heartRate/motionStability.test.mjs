import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyMotionStability,
  createMotionStabilityTracker,
} from './motionStability.ts';

function samplesFromOffsets(points) {
  return points.map((point, index) => ({
    timestamp: index * 50,
    x: point.x,
    y: point.y,
    z: point.z,
  }));
}

test('classifies a mostly still phone as stable', () => {
  const samples = samplesFromOffsets(
    Array.from({ length: 20 }, (_, index) => ({
      x: index % 2 === 0 ? 0.004 : -0.003,
      y: index % 3 === 0 ? 0.004 : -0.002,
      z: 1 + (index % 2 === 0 ? 0.003 : -0.003),
    })),
  );

  assert.equal(classifyMotionStability(samples).state, 'stable');
});

test('classifies small repeated hand shake as shaky', () => {
  const samples = samplesFromOffsets(
    Array.from({ length: 20 }, (_, index) => ({
      x: index % 2 === 0 ? 0.035 : -0.035,
      y: 0.01,
      z: 1,
    })),
  );

  assert.equal(classifyMotionStability(samples).state, 'shaky');
});

test('classifies a clear phone jolt as moving', () => {
  const points = Array.from({ length: 20 }, (_, index) => ({
    x: index < 10 ? 0 : 0.28,
    y: 0,
    z: index < 10 ? 1 : 0.84,
  }));

  assert.equal(classifyMotionStability(samplesFromOffsets(points)).state, 'moving');
});

test('tracker holds moving briefly and then recovers to stable', () => {
  const tracker = createMotionStabilityTracker({ movingHoldMs: 200 });
  let result = tracker.getState();

  for (let i = 0; i < 8; i++) {
    result = tracker.update({ timestamp: i * 50, x: 0, y: 0, z: 1 });
  }
  assert.equal(result.state, 'stable');

  result = tracker.update({ timestamp: 450, x: 0.3, y: 0, z: 0.82 });
  assert.equal(result.state, 'moving');

  result = tracker.update({ timestamp: 500, x: 0, y: 0, z: 1 });
  assert.equal(result.state, 'moving');

  for (let i = 0; i < 24; i++) {
    result = tracker.update({ timestamp: 750 + i * 50, x: 0.002, y: -0.002, z: 1 });
  }
  assert.equal(result.state, 'stable');
});
