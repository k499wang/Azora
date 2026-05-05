import test from 'node:test';
import assert from 'node:assert/strict';
import { registerAuthIdentitySync } from './authIdentitySyncCore.ts';

function flushMicrotasks() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function createSession(userId, options = {}) {
  return {
    access_token: `token-${userId}`,
    refresh_token: `refresh-${userId}`,
    user: {
      id: userId,
      email: options.email ?? null,
      app_metadata: {
        provider: options.provider ?? null,
      },
    },
  };
}

function createHarness(initialSession) {
  const events = [];
  let authListener = null;
  let unsubscribed = false;

  const client = {
    auth: {
      getSession: async () => ({
        data: { session: initialSession },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (listener) => {
        authListener = listener;
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                unsubscribed = true;
              },
            },
          },
        };
      },
    },
  };

  const dependencies = {
    clearRevenueCatIdentity: async () => {
      events.push({ event: 'SIGNED_OUT', session: null });
    },
    ensureProfile: async (userId) => {
      events.push({
        event: 'PROFILE_ENSURED',
        session: createSession(userId),
      });
    },
    getSupabaseClient: () => client,
    onUserSignedIn: (user) => {
      events.push({
        event: 'SIGNED_IN',
        session: createSession(user.id, {
          email: user.email ?? null,
          provider: user.authProvider ?? null,
        }),
      });
    },
    onUserSignedOut: () => {
      events.push({ event: 'PASSWORD_RECOVERY', session: null });
    },
    syncRevenueCatIdentity: async (user) => {
      events.push({
        event: 'USER_UPDATED',
        session: createSession(user.id, {
          email: user.email ?? null,
        }),
      });
    },
    warn: (message, error) => {
      throw new Error(`${message}: ${String(error)}`);
    },
  };

  return {
    dependencies,
    emit(event, session) {
      assert.ok(authListener, 'auth listener not registered');
      authListener(event, session);
    },
    getEvents() {
      return events;
    },
    isUnsubscribed() {
      return unsubscribed;
    },
  };
}

test('registerAuthIdentitySync syncs the initial signed-in session once', async () => {
  const session = createSession('user-1', {
    email: 'user-1@example.com',
    provider: 'google',
  });
  const harness = createHarness(session);

  const unsubscribe = registerAuthIdentitySync(harness.dependencies);
  await flushMicrotasks();

  assert.deepEqual(
    harness.getEvents().map((entry) => entry.event),
    ['PROFILE_ENSURED', 'SIGNED_IN', 'USER_UPDATED'],
  );

  unsubscribe();
  assert.equal(harness.isUnsubscribed(), true);
});

test('registerAuthIdentitySync ignores TOKEN_REFRESHED for the same user', async () => {
  const session = createSession('user-1', {
    email: 'user-1@example.com',
    provider: 'apple',
  });
  const harness = createHarness(session);

  registerAuthIdentitySync(harness.dependencies);
  await flushMicrotasks();

  harness.emit('TOKEN_REFRESHED', {
    ...session,
    access_token: 'rotated-token',
  });
  await flushMicrotasks();

  assert.deepEqual(
    harness.getEvents().map((entry) => entry.event),
    ['PROFILE_ENSURED', 'SIGNED_IN', 'USER_UPDATED'],
  );
});

test('registerAuthIdentitySync forces a refresh on USER_UPDATED', async () => {
  const session = createSession('user-1', {
    email: 'before@example.com',
    provider: 'apple',
  });
  const harness = createHarness(session);

  registerAuthIdentitySync(harness.dependencies);
  await flushMicrotasks();

  harness.emit(
    'USER_UPDATED',
    createSession('user-1', {
      email: 'after@example.com',
      provider: 'apple',
    }),
  );
  await flushMicrotasks();

  assert.deepEqual(
    harness.getEvents().map((entry) => entry.event),
    [
      'PROFILE_ENSURED',
      'SIGNED_IN',
      'USER_UPDATED',
      'PROFILE_ENSURED',
      'SIGNED_IN',
      'USER_UPDATED',
    ],
  );
});

test('registerAuthIdentitySync clears state on SIGNED_OUT', async () => {
  const session = createSession('user-1');
  const harness = createHarness(session);

  registerAuthIdentitySync(harness.dependencies);
  await flushMicrotasks();

  harness.emit('SIGNED_OUT', null);
  await flushMicrotasks();

  assert.deepEqual(
    harness.getEvents().map((entry) => entry.event),
    [
      'PROFILE_ENSURED',
      'SIGNED_IN',
      'USER_UPDATED',
      'PASSWORD_RECOVERY',
      'SIGNED_OUT',
    ],
  );
});

test('registerAuthIdentitySync ensures the profile before RevenueCat sync', async () => {
  const session = createSession('user-42', {
    email: 'user-42@example.com',
    provider: 'google',
  });
  const harness = createHarness(session);

  registerAuthIdentitySync(harness.dependencies);
  await flushMicrotasks();

  assert.deepEqual(
    harness.getEvents().map((entry) => entry.event),
    ['PROFILE_ENSURED', 'SIGNED_IN', 'USER_UPDATED'],
  );
});

test('registerAuthIdentitySync reports RevenueCat sync status for the initial session', async () => {
  const session = createSession('user-1');
  const harness = createHarness(session);
  const statuses = [];

  registerAuthIdentitySync({
    ...harness.dependencies,
    getRevenueCatAvailability: () => ({ status: 'ready' }),
    onRevenueCatSyncStarted: (userId) => {
      statuses.push({ status: 'syncing', userId });
    },
    onRevenueCatSyncSucceeded: (userId) => {
      statuses.push({ status: 'synced', userId });
    },
  });
  await flushMicrotasks();

  assert.deepEqual(statuses, [
    { status: 'syncing', userId: 'user-1' },
    { status: 'synced', userId: 'user-1' },
  ]);
});

test('registerAuthIdentitySync reports RevenueCat unavailable without syncing', async () => {
  const session = createSession('user-1');
  const harness = createHarness(session);
  const statuses = [];

  registerAuthIdentitySync({
    ...harness.dependencies,
    getRevenueCatAvailability: () => ({
      status: 'unavailable',
      reason: 'missing_api_key',
    }),
    onRevenueCatSyncStarted: (userId) => {
      statuses.push({ status: 'syncing', userId });
    },
    onRevenueCatSyncUnavailable: (reason) => {
      statuses.push({ status: 'unavailable', reason });
    },
  });
  await flushMicrotasks();

  assert.deepEqual(statuses, [
    { status: 'unavailable', reason: 'missing_api_key' },
  ]);
  assert.deepEqual(
    harness.getEvents().map((entry) => entry.event),
    ['PROFILE_ENSURED', 'SIGNED_IN'],
  );
});

test('registerAuthIdentitySync reports RevenueCat sync failures', async () => {
  const session = createSession('user-1');
  const harness = createHarness(session);
  const statuses = [];

  registerAuthIdentitySync({
    ...harness.dependencies,
    syncRevenueCatIdentity: async () => {
      throw new Error('RevenueCat exploded');
    },
    warn: (message, error) => {
      statuses.push({
        status: 'warned',
        message,
        error: error instanceof Error ? error.message : String(error),
      });
    },
    getRevenueCatAvailability: () => ({ status: 'ready' }),
    onRevenueCatSyncStarted: (userId) => {
      statuses.push({ status: 'syncing', userId });
    },
    onRevenueCatSyncFailed: (error, userId) => {
      statuses.push({
        status: 'failed',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
  await flushMicrotasks();

  assert.deepEqual(statuses, [
    { status: 'syncing', userId: 'user-1' },
    { status: 'failed', userId: 'user-1', error: 'RevenueCat exploded' },
    {
      status: 'warned',
      message: 'Failed to sync auth identities',
      error: 'RevenueCat exploded',
    },
  ]);
});

test('registerAuthIdentitySync reports RevenueCat signed out', async () => {
  const session = createSession('user-1');
  const harness = createHarness(session);
  const statuses = [];

  registerAuthIdentitySync({
    ...harness.dependencies,
    onRevenueCatSignedOut: () => {
      statuses.push({ status: 'signed_out' });
    },
  });
  await flushMicrotasks();

  harness.emit('SIGNED_OUT', null);
  await flushMicrotasks();

  assert.deepEqual(statuses, [{ status: 'signed_out' }]);
});

test('registerAuthIdentitySync returns a noop when Supabase is unavailable', () => {
  const unsubscribe = registerAuthIdentitySync({
    clearRevenueCatIdentity: async () => undefined,
    ensureProfile: async () => undefined,
    getSupabaseClient: () => null,
    onUserSignedIn: () => undefined,
    onUserSignedOut: () => undefined,
    syncRevenueCatIdentity: async () => undefined,
    warn: () => undefined,
  });

  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();
});
