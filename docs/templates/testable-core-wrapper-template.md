# Testable Core + Wrapper Template

Use this when an integration has:

- sequencing
- identity state
- configuration rules
- SDK behavior that should be tested without the real SDK

This is the pattern used for RevenueCat in this repo.

Modeled on:

- `src/services/subscriptions/revenueCatClientCore.ts`
- `src/services/subscriptions/revenueCatClient.ts`
- `src/services/subscriptions/revenueCatClientCore.test.mjs`

## 1. Core File

```ts
export interface SDK_USER_HERE {
  id: string;
  email?: string | null;
}

export interface SDK_HERE {
  configure: (options: { apiKey: string; appUserID: string }) => void;
  getState: () => Promise<unknown>;
  isConfigured: () => Promise<boolean>;
  logIn: (appUserId: string) => Promise<unknown>;
  setEmail: (email: string | null) => Promise<void>;
  setLogLevel: (level: unknown) => Promise<void> | void;
}

export interface CLIENT_DEPENDENCIES_HERE {
  apiKey: string | null;
  debugLogLevel: unknown;
  errorLogLevel: unknown;
  isDev: boolean;
  isSupportedPlatform: boolean;
  sdk: SDK_HERE;
}

export class SDKSignedOutError extends Error {
  constructor() {
    super('SDK is unavailable while signed out.');
    this.name = 'SDKSignedOutError';
  }
}

export function createSDKClient(dependencies: CLIENT_DEPENDENCIES_HERE) {
  let currentAppUserId: string | null = null;
  let serialTask: Promise<void> = Promise.resolve();

  function runSerial(task: () => Promise<void>): Promise<void> {
    serialTask = serialTask.then(task, task);
    return serialTask;
  }

  async function ensureConfigured(appUserId: string): Promise<void> {
    if (!dependencies.isSupportedPlatform || dependencies.apiKey == null) {
      return;
    }

    await dependencies.sdk.setLogLevel(
      dependencies.isDev ? dependencies.debugLogLevel : dependencies.errorLogLevel,
    );

    const isConfigured = await dependencies.sdk.isConfigured();
    if (!isConfigured) {
      dependencies.sdk.configure({
        apiKey: dependencies.apiKey,
        appUserID: appUserId,
      });
      currentAppUserId = appUserId;
      return;
    }

    if (currentAppUserId !== appUserId) {
      await dependencies.sdk.logIn(appUserId);
      currentAppUserId = appUserId;
    }
  }

  function isReady(): boolean {
    return dependencies.isSupportedPlatform && dependencies.apiKey != null;
  }

  function requireCurrentAppUserId(): string {
    if (currentAppUserId == null) {
      throw new SDKSignedOutError();
    }

    return currentAppUserId;
  }

  return {
    clearIdentity(): Promise<void> {
      return runSerial(async () => {
        currentAppUserId = null;
      });
    },
    getCurrentAppUserId(): string | null {
      return currentAppUserId;
    },
    isReady,
    requireCurrentAppUserId,
    syncIdentity(user: SDK_USER_HERE): Promise<void> {
      return runSerial(async () => {
        if (!isReady()) {
          currentAppUserId = user.id;
          return;
        }

        await ensureConfigured(user.id);
        currentAppUserId = user.id;
        requireCurrentAppUserId();
        await dependencies.sdk.setEmail(user.email ?? null);
        await dependencies.sdk.getState();
      });
    },
  };
}
```

## 2. Thin SDK Wrapper File

```ts
import SDK, { LOG_LEVEL } from 'REAL_SDK_PACKAGE_HERE';
import { getSDKApiKey, isSDKSupportedPlatform } from './sdkConfig';
import {
  createSDKClient,
  SDKSignedOutError,
  type SDK_USER_HERE,
} from './sdkClientCore';

const sdkClient = createSDKClient({
  apiKey: getSDKApiKey(),
  debugLogLevel: LOG_LEVEL.DEBUG,
  errorLogLevel: LOG_LEVEL.ERROR,
  isDev: __DEV__,
  isSupportedPlatform: isSDKSupportedPlatform,
  sdk: {
    configure: SDK.configure,
    getState: SDK.getState,
    isConfigured: SDK.isConfigured,
    logIn: async (appUserId) => {
      await SDK.logIn(appUserId);
    },
    setEmail: SDK.setEmail,
    setLogLevel: async (level) => {
      await SDK.setLogLevel(level as LOG_LEVEL);
    },
  },
});

export { SDKSignedOutError, type SDK_USER_HERE };

export function getCurrentSDKAppUserId(): string | null {
  return sdkClient.getCurrentAppUserId();
}

export function isSDKReady(): boolean {
  return sdkClient.isReady();
}

export function requireCurrentSDKAppUserId(): string {
  return sdkClient.requireCurrentAppUserId();
}

export function syncSDKIdentity(user: SDK_USER_HERE): Promise<void> {
  return sdkClient.syncIdentity(user);
}

export function clearSDKIdentity(): Promise<void> {
  return sdkClient.clearIdentity();
}
```

## 3. Core Test File

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSDKClient,
  SDKSignedOutError,
} from './sdkClientCore.ts';

function createHarness(options = {}) {
  const calls = [];
  let configured = options.initiallyConfigured ?? false;

  const client = createSDKClient({
    apiKey: options.apiKey ?? 'sdk_test_key',
    debugLogLevel: 'debug',
    errorLogLevel: 'error',
    isDev: options.isDev ?? false,
    isSupportedPlatform: options.isSupportedPlatform ?? true,
    sdk: {
      configure: ({ apiKey, appUserID }) => {
        calls.push({ fn: 'configure', apiKey, appUserID });
        configured = true;
      },
      getState: async () => {
        calls.push({ fn: 'getState' });
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

test('syncIdentity configures the SDK with the authenticated app user id', async () => {
  const harness = createHarness();

  await harness.client.syncIdentity({
    id: 'user-1',
    email: 'user-1@example.com',
  });

  assert.equal(harness.client.getCurrentAppUserId(), 'user-1');
  assert.deepEqual(
    harness.calls.map((call) => call.fn),
    ['setLogLevel', 'configure', 'setEmail', 'getState'],
  );
});

test('clearIdentity signs the app out locally', async () => {
  const harness = createHarness();

  await harness.client.syncIdentity({ id: 'user-1' });
  await harness.client.clearIdentity();

  assert.equal(harness.client.getCurrentAppUserId(), null);
  assert.throws(
    () => harness.client.requireCurrentAppUserId(),
    SDKSignedOutError,
  );
});

test('switching users uses SDK logIn directly once configured', async () => {
  const harness = createHarness({ initiallyConfigured: true });

  await harness.client.syncIdentity({ id: 'user-1' });
  await harness.client.syncIdentity({ id: 'user-2' });

  assert.equal(harness.calls.some((call) => call.fn === 'logIn'), true);
});
```

## Notes

- Put the branching and sequencing rules in the core file, not the SDK wrapper.
- Keep the wrapper thin enough that it mostly binds real SDK functions.
- Test the core directly with fakes.
- If the integration is simple and stateless, do not force this pattern. A plain service module is enough.
