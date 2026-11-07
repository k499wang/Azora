import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCurrentSession } from './sessionValidatorCore.ts';

function createMockClient({ getUserResult }) {
  return {
    auth: {
      async getUser() {
        return getUserResult;
      },
    },
  };
}

test('validateCurrentSession is valid when getUser succeeds', async () => {
  const client = createMockClient({
    getUserResult: { data: { user: { id: 'user-1' } }, error: null },
  });

  assert.equal(await validateCurrentSession(client), 'valid');
});

test('validateCurrentSession is invalid when the server rejects the session', async () => {
  for (const status of [400, 401, 403, 404]) {
    const client = createMockClient({
      getUserResult: {
        data: { user: null },
        error: Object.assign(new Error('rejected'), { status }),
      },
    });

    assert.equal(await validateCurrentSession(client), 'invalid', `status ${status}`);
  }
});

test('validateCurrentSession is unknown when the server could not answer', async () => {
  // auth-js reports a network failure as AuthRetryableFetchError with status 0.
  for (const status of [0, 429, 500, 503, undefined]) {
    const client = createMockClient({
      getUserResult: {
        data: { user: null },
        error: Object.assign(new Error('unreachable'), { status }),
      },
    });

    assert.equal(await validateCurrentSession(client), 'unknown', `status ${status}`);
  }
});

test('validateCurrentSession is unknown when getUser throws', async () => {
  const client = createMockClient({
    getUserResult: Promise.reject(new Error('network failure')),
  });

  assert.equal(await validateCurrentSession(client), 'unknown');
});
