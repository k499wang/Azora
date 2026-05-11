import test from 'node:test';
import assert from 'node:assert/strict';
import { loadInitialSession } from './authBootstrap.ts';

function createSession(id = 'user-1') {
  return {
    access_token: `token-${id}`,
    refresh_token: `refresh-${id}`,
    user: { id, email: null, app_metadata: {} },
  };
}

test('resolves with session when getSession returns before timeout', async () => {
  const session = createSession();
  const result = await loadInitialSession(async () => session, 100);
  assert.equal(result, session);
});

test('resolves with null when getSession exceeds timeout', async () => {
  const start = Date.now();
  const result = await loadInitialSession(
    () => new Promise(() => {}),
    50,
  );
  const elapsed = Date.now() - start;
  assert.equal(result, null);
  assert.ok(elapsed >= 40 && elapsed < 500, `unexpected elapsed time: ${elapsed}ms`);
});

test('resolves with null when getSession throws', async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const result = await loadInitialSession(async () => {
      throw new Error('network down');
    }, 100);
    assert.equal(result, null);
  } finally {
    console.warn = originalWarn;
  }
});

test('resolves with null when getSession rejects asynchronously', async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const result = await loadInitialSession(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('late failure')), 10);
        }),
      100,
    );
    assert.equal(result, null);
  } finally {
    console.warn = originalWarn;
  }
});
