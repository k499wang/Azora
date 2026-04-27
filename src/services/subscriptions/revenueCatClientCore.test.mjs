import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRevenueCatClient,
  RevenueCatSignedOutError,
} from './revenueCatClientCore.ts';

function createHarness(options = {}) {
  const calls = [];
  let configured = options.initiallyConfigured ?? false;

  const client = createRevenueCatClient({
    apiKey: options.apiKey ?? 'rc_test_key',
    debugLogLevel: 'debug',
    errorLogLevel: 'error',
    isDev: options.isDev ?? false,
    isSupportedPlatform: options.isSupportedPlatform ?? true,
    sdk: {
      configure: ({ apiKey, appUserID }) => {
        calls.push({ fn: 'configure', apiKey, appUserID });
        configured = true;
      },
      getCustomerInfo: async () => {
        calls.push({ fn: 'getCustomerInfo' });
        return {};
      },
      isConfigured: async () => configured,
      logIn: async (appUserId) => {
        calls.push({ fn: 'logIn', appUserId });
        return {};
      },
      setEmail: async (email) => {
        calls.push({ fn: 'setEmail', email });
      },
      setLogLevel: async (level) => {
        calls.push({ fn: 'setLogLevel', level });
      },
    },
  });

  return {
    calls,
    client,
  };
}

test('syncIdentity configures RevenueCat with the authenticated Supabase user id', async () => {
  const harness = createHarness();

  await harness.client.syncIdentity({
    id: 'user-1',
    email: 'user-1@example.com',
  });

  assert.equal(harness.client.getCurrentAppUserId(), 'user-1');
  assert.deepEqual(
    harness.calls.map((call) => call.fn),
    ['setLogLevel', 'configure', 'setEmail', 'getCustomerInfo'],
  );
  assert.deepEqual(harness.calls[1], {
    fn: 'configure',
    apiKey: 'rc_test_key',
    appUserID: 'user-1',
  });
});

test('clearIdentity signs the app out locally without creating an anonymous RevenueCat user', async () => {
  const harness = createHarness();

  await harness.client.syncIdentity({ id: 'user-1' });
  await harness.client.clearIdentity();

  assert.equal(harness.client.getCurrentAppUserId(), null);
  assert.throws(
    () => harness.client.requireCurrentAppUserId(),
    RevenueCatSignedOutError,
  );
  assert.equal(harness.calls.some((call) => call.fn === 'logOut'), false);
});

test('switching between authenticated users uses RevenueCat logIn directly', async () => {
  const harness = createHarness({ initiallyConfigured: true });

  await harness.client.syncIdentity({ id: 'user-1' });
  await harness.client.syncIdentity({ id: 'user-2' });

  assert.deepEqual(
    harness.calls.map((call) => call.fn),
    [
      'setLogLevel',
      'logIn',
      'setEmail',
      'getCustomerInfo',
      'setLogLevel',
      'logIn',
      'setEmail',
      'getCustomerInfo',
    ],
  );
  assert.deepEqual(harness.calls[1], {
    fn: 'logIn',
    appUserId: 'user-1',
  });
  assert.deepEqual(harness.calls[5], {
    fn: 'logIn',
    appUserId: 'user-2',
  });
});
