import test from 'node:test';
import assert from 'node:assert/strict';
import { finishAccountDeletion, resolveBootSession } from './authTransitions.ts';

const session = { access_token: 'token', user: { id: 'user-1' } };

function bootDeps(overrides = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      validate: async () => 'valid',
      signOut: async () => {
        calls.push('signOut');
      },
      warn: () => {},
      ...overrides,
    },
  };
}

test('no stored session stays signed out without validating', async () => {
  const { deps } = bootDeps({
    validate: async () => {
      throw new Error('should not validate');
    },
  });
  assert.equal(await resolveBootSession(null, deps), null);
});

test('a valid session is kept', async () => {
  const { deps, calls } = bootDeps();
  assert.equal(await resolveBootSession(session, deps), session);
  assert.deepEqual(calls, []);
});

test('launching offline keeps the session and never signs out', async () => {
  const { deps, calls } = bootDeps({ validate: async () => 'unknown' });
  assert.equal(await resolveBootSession(session, deps), session);
  assert.deepEqual(calls, []);
});

test('a validation that throws keeps the session', async () => {
  const { deps, calls } = bootDeps({
    validate: async () => {
      throw new Error('network');
    },
  });
  assert.equal(await resolveBootSession(session, deps), session);
  assert.deepEqual(calls, []);
});

test('a slow validation keeps the session instead of signing out', async () => {
  const { deps, calls } = bootDeps({ validate: () => new Promise(() => {}), timeoutMs: 5 });
  assert.equal(await resolveBootSession(session, deps), session);
  assert.deepEqual(calls, []);
});

test('a rejected session signs out', async () => {
  const { deps, calls } = bootDeps({ validate: async () => 'invalid' });
  assert.equal(await resolveBootSession(session, deps), null);
  assert.deepEqual(calls, ['signOut']);
});

test('a failed sign-out still leaves booting', async () => {
  const { deps } = bootDeps({
    validate: async () => 'invalid',
    signOut: async () => {
      throw new Error('offline');
    },
  });
  assert.equal(await resolveBootSession(session, deps), null);
});

test('account deletion ends the auth client session, then the app state', async () => {
  const calls = [];
  await finishAccountDeletion({
    signOutGoogle: async () => calls.push('google'),
    signOutLocal: async () => calls.push('local'),
    applySignedOut: () => calls.push('applied'),
    warn: () => {},
  });
  assert.deepEqual(calls, ['google', 'local', 'applied']);
});

test('account deletion still signs the app out when the client sign-out fails', async () => {
  const calls = [];
  await finishAccountDeletion({
    signOutGoogle: async () => calls.push('google'),
    signOutLocal: async () => {
      throw new Error('offline');
    },
    applySignedOut: () => calls.push('applied'),
    warn: () => calls.push('warned'),
  });
  assert.deepEqual(calls, ['google', 'warned', 'applied']);
});
