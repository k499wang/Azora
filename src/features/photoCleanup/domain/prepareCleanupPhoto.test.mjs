import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCleanupPhoto } from './prepareCleanupPhoto.ts';

function harness(overrides = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      resize: async () => ({ uri: 'small.jpg', base64: 'abc' }),
      onResized: (uri) => calls.push(`resized:${uri}`),
      generatePlan: async (base64) => calls.push(`plan:${base64}`),
      onFailed: () => calls.push('failed'),
      ...overrides,
    },
  };
}

test('a resized photo goes on to the plan', async () => {
  const { deps, calls } = harness();
  await prepareCleanupPhoto('large.heic', deps);
  assert.deepEqual(calls, ['resized:small.jpg', 'plan:abc']);
});

test('a photo that cannot be read reports failure instead of rejecting', async () => {
  const { deps, calls } = harness({
    resize: async () => {
      throw new Error('asset unavailable');
    },
  });
  await prepareCleanupPhoto('icloud.heic', deps);
  assert.deepEqual(calls, ['failed']);
});

test('a photo without image data reports failure', async () => {
  const { deps, calls } = harness({ resize: async () => ({ uri: 'small.jpg', base64: undefined }) });
  await prepareCleanupPhoto('large.heic', deps);
  assert.deepEqual(calls, ['failed']);
});

test('a failure before the plan request reports failure', async () => {
  const { deps, calls } = harness({
    generatePlan: async () => {
      throw new Error('consent read failed');
    },
  });
  await prepareCleanupPhoto('large.heic', deps);
  assert.deepEqual(calls, ['resized:small.jpg', 'failed']);
});
