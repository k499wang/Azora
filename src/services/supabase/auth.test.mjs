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

test('validateCurrentSession returns true when getUser succeeds', async () => {
  const client = createMockClient({
    getUserResult: {
      data: { user: { id: 'user-1' } },
      error: null,
    },
  });

  const result = await validateCurrentSession(client);
  assert.equal(result, true);
});

test('validateCurrentSession returns false when getUser returns an error', async () => {
  const client = createMockClient({
    getUserResult: {
      data: { user: null },
      error: new Error('JWT expired'),
    },
  });

  const result = await validateCurrentSession(client);
  assert.equal(result, false);
});

test('validateCurrentSession returns false when getUser throws', async () => {
  const client = createMockClient({
    getUserResult: Promise.reject(new Error('network failure')),
  });

  try {
    await validateCurrentSession(client);
    assert.fail('expected validateCurrentSession to throw');
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.equal(error.message, 'network failure');
  }
});
