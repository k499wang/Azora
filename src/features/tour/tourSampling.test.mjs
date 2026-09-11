import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_STABLE_SAMPLES,
  isSamePosition,
  sampleUntilStable,
  trackMovement,
  wait,
} from './tourSampling.ts';

const POLL_MS = 2;
const OPTIONS = { timeoutMs: 500, pollMs: POLL_MS };

function rect(overrides = {}) {
  return { x: 20, y: 300, width: 340, height: 120, ...overrides };
}

/** Replays a scripted sequence of measurements, holding on the last one. */
function replay(frames) {
  let index = 0;
  const calls = [];
  const measure = async () => {
    const frame = frames[Math.min(index, frames.length - 1)];
    index += 1;
    calls.push(frame);
    return frame;
  };
  return { measure, calls: () => calls, polls: () => index };
}

function repeat(frame, times) {
  return Array.from({ length: times }, () => frame);
}

test('a target that holds still is believed, and its settled rect returned', async () => {
  const settled = rect({ y: 180 });
  const { measure } = replay([
    rect({ y: 640 }),
    rect({ y: 420 }),
    rect({ y: 240 }),
    ...repeat(settled, REQUIRED_STABLE_SAMPLES + 1),
  ]);

  const sample = await sampleUntilStable(measure, OPTIONS);

  assert.equal(sample.stable, true);
  assert.deepEqual(sample.rect, settled);
});

test('a target still sliding in horizontally is never taken as settled', async () => {
  // The third stop is a sticky action on a screen pushed with slide_from_right:
  // it has its full size and the wrong x for the whole transition. Comparing
  // only y and height read that as an element at rest, and the cutout was drawn
  // halfway across the screen.
  let x = 390;
  const measure = async () => {
    x -= 6;
    return rect({ x });
  };

  const sample = await sampleUntilStable(measure, { timeoutMs: 60, pollMs: POLL_MS });

  assert.equal(sample.stable, false);
  assert.notEqual(sample.rect, null);
});

test('a target whose height keeps growing is never taken as settled', async () => {
  // Home's dailies list: skeleton, then real rows, then the rows measured and
  // laid out again, with a card arriving above it throughout.
  let height = 90;
  const measure = async () => {
    height += 24;
    return rect({ height });
  };

  const sample = await sampleUntilStable(measure, { timeoutMs: 60, pollMs: POLL_MS });

  assert.equal(sample.stable, false);
});

test('a target that never registers times out with nothing', async () => {
  const { measure, polls } = replay([null]);

  const sample = await sampleUntilStable(measure, { timeoutMs: 40, pollMs: POLL_MS });

  assert.deepEqual(sample, { rect: null, stable: false });
  assert.ok(polls() > 1, 'kept polling for a target that had not mounted yet');
});

test('a target that mounts late is still caught inside the timeout', async () => {
  const arrived = rect();
  const { measure } = replay([
    ...repeat(null, 6),
    ...repeat(arrived, REQUIRED_STABLE_SAMPLES),
  ]);

  const sample = await sampleUntilStable(measure, OPTIONS);

  assert.equal(sample.stable, true);
  assert.deepEqual(sample.rect, arrived);
});

test('an element that disappears mid-run restarts the stable streak', async () => {
  const held = rect();
  const { measure } = replay([
    ...repeat(held, REQUIRED_STABLE_SAMPLES - 1),
    null,
    ...repeat(held, REQUIRED_STABLE_SAMPLES - 1),
    // Without the reset the run above would already have been enough.
    ...repeat(held, 1),
  ]);

  const sample = await sampleUntilStable(measure, OPTIONS);

  assert.equal(sample.stable, true);
});

test('sub-pixel jitter does not count as movement', async () => {
  const { measure } = replay([
    rect({ y: 300 }),
    rect({ y: 300.2 }),
    rect({ y: 300.4 }),
    rect({ y: 300.1 }),
    rect({ y: 300.3 }),
  ]);

  const sample = await sampleUntilStable(measure, OPTIONS);

  assert.equal(sample.stable, true);
});

test('the grace period holds the first poll back', async () => {
  const { measure, polls } = replay([rect()]);
  const startedAt = Date.now();

  await sampleUntilStable(measure, { timeoutMs: 200, pollMs: POLL_MS, graceMs: 60 });

  assert.ok(Date.now() - startedAt >= 55, 'measured before the scroll could begin');
  assert.ok(polls() >= REQUIRED_STABLE_SAMPLES);
});

test('the grace period never outlasts the timeout', async () => {
  const { measure } = replay([rect()]);
  const startedAt = Date.now();

  await sampleUntilStable(measure, { timeoutMs: 30, pollMs: POLL_MS, graceMs: 5000 });

  assert.ok(Date.now() - startedAt < 1000);
});

test('every edge counts as a position', () => {
  const base = rect();
  assert.equal(isSamePosition(base, { ...base }), true);
  assert.equal(isSamePosition(base, { ...base, x: base.x + 40 }), false);
  assert.equal(isSamePosition(base, { ...base, y: base.y + 40 }), false);
  assert.equal(isSamePosition(base, { ...base, width: base.width + 40 }), false);
  assert.equal(isSamePosition(base, { ...base, height: base.height + 40 }), false);
});

test('tracking reports a placed stop being pushed down the page', async () => {
  const placed = rect({ y: 220 });
  const shoved = rect({ y: 220 + 132 });
  let current = placed;
  const moves = [];

  const stop = trackMovement(async () => current, placed, (moved) => {
    moves.push(moved);
  }, POLL_MS);

  await wait(POLL_MS * 4);
  assert.deepEqual(moves, [], 'reported a move for an element that had not moved');

  // The room progress card finishes loading and appears above it.
  current = shoved;
  await wait(POLL_MS * 6);
  stop();

  assert.deepEqual(moves, [shoved]);
});

test('tracking reports an element that goes away, once', async () => {
  const placed = rect();
  let current = placed;
  const moves = [];

  const stop = trackMovement(async () => current, placed, (moved) => {
    moves.push(moved);
  }, POLL_MS);

  current = null;
  await wait(POLL_MS * 8);
  stop();

  assert.deepEqual(moves, [null]);
});

test('tracking stops reporting as soon as it is stopped', async () => {
  let current = rect();
  let calls = 0;

  const stop = trackMovement(async () => current, current, () => {
    calls += 1;
  }, POLL_MS);

  stop();
  current = rect({ y: 999 });
  await wait(POLL_MS * 10);

  assert.equal(calls, 0);
});
