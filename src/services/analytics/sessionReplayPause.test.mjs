import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionReplayPause } from './sessionReplayPause.ts';

function createHarness() {
  const calls = [];
  const pause = createSessionReplayPause({
    stop: async () => {
      calls.push('stop');
    },
    resume: async () => {
      calls.push('resume');
    },
  });

  return { calls, pause };
}

const flushQueue = () => new Promise((resolve) => setImmediate(resolve));

test('nested replay pauses resume only after the final holder releases', async () => {
  const { calls, pause } = createHarness();
  const releaseFirst = pause({ autoResumeAfterMs: null });
  const releaseSecond = pause({ autoResumeAfterMs: null });

  await flushQueue();
  assert.deepEqual(calls, ['stop']);

  releaseFirst();
  releaseFirst();
  await flushQueue();
  assert.deepEqual(calls, ['stop']);

  releaseSecond();
  await flushQueue();
  assert.deepEqual(calls, ['stop', 'resume']);
});

test('each pause watchdog releases only its own holder', async () => {
  const { calls, pause } = createHarness();
  pause({ autoResumeAfterMs: 0 });
  const releaseLongAnimation = pause({ autoResumeAfterMs: null });

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(calls, ['stop']);

  releaseLongAnimation();
  await flushQueue();
  assert.deepEqual(calls, ['stop', 'resume']);
});

test('a new holder prevents a queued resume from restarting replay', async () => {
  const { calls, pause } = createHarness();
  const releaseFirst = pause({ autoResumeAfterMs: null });

  await flushQueue();
  assert.deepEqual(calls, ['stop']);

  releaseFirst();
  const releaseSecond = pause({ autoResumeAfterMs: null });
  await flushQueue();
  assert.deepEqual(calls, ['stop']);

  releaseSecond();
  await flushQueue();
  assert.deepEqual(calls, ['stop', 'resume']);
});
