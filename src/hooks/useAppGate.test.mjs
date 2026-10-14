import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAppGate } from './appGateCore.ts';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const noop = async () => {};

function createBaseQueries(overrides = {}) {
  return {
    onboardingStatusQuery: {
      isPending: false,
      isError: false,
      data: undefined,
      ...overrides.onboardingStatusQuery,
    },
    savedOnboardingProfileQuery: {
      isPending: false,
      isError: false,
      data: null,
      ...overrides.savedOnboardingProfileQuery,
    },
    entitlementQuery: {
      isPending: false,
      data: undefined,
      ...overrides.entitlementQuery,
    },
  };
}

test('returns booting when authStatus is booting', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries();

  const result = computeAppGate(
    'booting',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'booting');
});

test('returns signed_out when authStatus is signed_out', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries();

  const result = computeAppGate(
    'signed_out',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'signed_out');
});

test('returns signed_out when user is null', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries();

  const result = computeAppGate(
    'signed_in',
    null,
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'signed_out');
});

test('returns booting when onboardingStatusQuery is pending', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: true, isError: false, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'booting');
});

test('returns connection_error when the first onboarding status read fails', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: true, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'connection_error');
});

test('returns connection_error when the first saved profile read fails', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: { isPending: false, isError: true, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'connection_error');
});

test('returns booting when savedOnboardingProfileQuery is pending', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: { isPending: true, isError: false, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'booting');
});

test('returns needs_onboarding when onboarding is incomplete and no saved profile', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'needs_onboarding');
  assert.equal(result.savedOnboardingProfile, null);
});

test('returns ready when onboarding is completed', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: true },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'ready');
});

test('returns booting when pro user has saved profile and entitlement is pending', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 },
      },
      entitlementQuery: { isPending: true, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'booting');
});

test('returns booting when pro user has saved profile and auto-complete should start', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 },
      },
      entitlementQuery: { isPending: false, data: { isPro: true } },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    true,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'booting');
});

test('returns booting when pro user has saved profile and auto-complete is in progress', () => {
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 },
      },
      entitlementQuery: { isPending: false, data: { isPro: true } },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    true,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'booting');
});

test('returns needs_onboarding when manual completion is pending for pro user', () => {
  const savedProfile = { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 };
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: savedProfile,
      },
      entitlementQuery: { isPending: false, data: { isPro: true } },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    true,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'needs_onboarding');
  assert.equal(result.isCompletingOnboarding, true);
  assert.deepEqual(result.savedOnboardingProfile, savedProfile);
});

test('returns needs_onboarding when manual completion is pending and entitlement is pending', () => {
  const savedProfile = { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 };
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: savedProfile,
      },
      entitlementQuery: { isPending: true, data: undefined },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    true,
    false,
    null,
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'needs_onboarding');
  assert.equal(result.isCompletingOnboarding, true);
  assert.deepEqual(result.savedOnboardingProfile, savedProfile);
});

test('returns needs_onboarding when auto-complete previously failed for this user', () => {
  const savedProfile = { onboardingGoal: 'stress', age: 30, gender: 'male', dailyMinutes: 10 };
  const { onboardingStatusQuery, savedOnboardingProfileQuery, entitlementQuery } =
    createBaseQueries({
      onboardingStatusQuery: { isPending: false, isError: false, data: false },
      savedOnboardingProfileQuery: {
        isPending: false,
        isError: false,
        data: savedProfile,
      },
      entitlementQuery: { isPending: false, data: { isPro: true } },
    });

  const result = computeAppGate(
    'signed_in',
    { id: 'user-1' },
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    false,
    false,
    'user-1',
    noop,
    noop,
    false,
    noop,
  );

  assert.equal(result.status, 'needs_onboarding');
  assert.deepEqual(result.savedOnboardingProfile, savedProfile);
});

function gateForQueries(overrides, { authStatus = 'signed_in', retry = noop } = {}) {
  const queries = createBaseQueries(overrides);
  return computeAppGate(
    authStatus,
    { id: 'user-1' },
    queries.onboardingStatusQuery,
    queries.savedOnboardingProfileQuery,
    queries.entitlementQuery,
    false, false, null, noop, noop, false, retry,
  );
}

test('completed onboarding stays ready despite failed background reads', () => {
  const result = gateForQueries({
    onboardingStatusQuery: { data: true, isError: true },
    savedOnboardingProfileQuery: { data: undefined, isError: true },
  });
  assert.equal(result.status, 'ready');
});

for (const savedProfile of [null, { onboardingGoal: 'Stress relief' }]) {
  test(`cached ${savedProfile == null ? 'new' : 'saved'} onboarding survives failed background reads`, () => {
    const result = gateForQueries({
      onboardingStatusQuery: { data: false, isError: true },
      savedOnboardingProfileQuery: { data: savedProfile, isError: true },
    });
    assert.equal(result.status, 'needs_onboarding');
    assert.equal(result.savedOnboardingProfile, savedProfile);
  });
}

test('an auth signout wins over cached onboarding data and backend errors', () => {
  const result = gateForQueries({
    onboardingStatusQuery: { data: true, isError: true },
    savedOnboardingProfileQuery: { data: undefined, isError: true },
  }, { authStatus: 'signed_out' });
  assert.equal(result.status, 'signed_out');
});

const hookSource = readFileSync(new URL('./useAppGate.ts', import.meta.url), 'utf8');
const compiledHook = ts.transpileModule(hookSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function hookHarness({ statusData, profileData, failedQuery }) {
  const calls = [];
  const queries = createBaseQueries({
    onboardingStatusQuery: { data: statusData, isError: failedQuery === 'status' },
    savedOnboardingProfileQuery: { data: profileData, isError: failedQuery === 'profile' },
  });
  const authState = {
    status: 'signed_in', user: { id: 'user-1' },
    signOut: async () => { calls.push('signout'); },
  };
  const authStore = Object.assign((selector) => selector(authState), {
    getState: () => authState,
  });
  queries.onboardingStatusQuery.refetch = async () => {
    calls.push('status-refetch');
    Object.assign(queries.onboardingStatusQuery, { isError: false, data: false });
    return { data: false };
  };
  queries.savedOnboardingProfileQuery.refetch = async () => {
    calls.push('profile-refetch');
    Object.assign(queries.savedOnboardingProfileQuery, { isError: false, data: null });
    return { data: null };
  };
  const exports = {};
  vm.runInNewContext(compiledHook, {
    exports,
    console: { warn() {} },
    require(name) {
      switch (name) {
        case 'react': return {
          useRef: (current) => ({ current }),
          useState: (initial) => [initial, noop],
          useEffect: (effect) => { effect(); },
        };
        case '../stores/authStore': return { useAuthStore: authStore };
        case '../queries/profile/useOnboardingStatusQuery':
          return { useOnboardingStatusQuery: () => queries.onboardingStatusQuery };
        case '../queries/profile/useSavedOnboardingProfileQuery':
          return { useSavedOnboardingProfileQuery: () => queries.savedOnboardingProfileQuery };
        case '../queries/profile/useCompleteOnboardingMutation':
          return { useCompleteOnboardingMutation: () => ({ isPending: false, mutateAsync: noop }) };
        case '../queries/profile/useSaveOnboardingProfileMutation':
          return { useSaveOnboardingProfileMutation: () => ({ isPending: false, mutateAsync: noop }) };
        case '../queries/subscriptions/useUserEntitlementQuery':
          return { useUserEntitlementQuery: () => queries.entitlementQuery };
        case './appGateCore': return { computeAppGate };
        default: throw new Error(`Unexpected import: ${name}`);
      }
    },
  });
  return { render: exports.useAppGate, calls };
}

for (const failedQuery of ['status', 'profile']) {
  test(`a cold ${failedQuery} error never signs out and retry recovers the gate`, async () => {
    const { render, calls } = hookHarness({
      failedQuery,
      statusData: failedQuery === 'status' ? undefined : false,
      profileData: undefined,
    });
    const failedGate = render();
    assert.deepEqual(calls, []);
    assert.equal(failedGate.status, 'connection_error');
    await failedGate.retry();
    assert.deepEqual(calls, ['status-refetch', 'profile-refetch']);
    assert.equal(render().status, 'needs_onboarding');
  });
}

test('RootNavigator preserves mounted onboarding during a connection error and retry', () => {
  const root = readFileSync(new URL('../app/navigation/RootNavigator.tsx', import.meta.url), 'utf8');
  const functionSource = root.slice(root.indexOf('export function RootNavigator'))
    .replace('export function', 'function');
  const refs = [];
  let refIndex = 0;
  let gate = { status: 'needs_onboarding' };
  const dependencies = {
    React: { createElement: (type, props) => ({ type, props }) },
    useRef: (initial) => {
      const index = refIndex++;
      return refs[index] ??= { current: initial };
    },
    useAppGate: () => gate,
    usePlanPrefetch: () => {},
    OnboardingRoot: 'onboarding', ConnectionError: 'connection-error',
    BrandSplash: 'splash', AuthLandingScreen: 'auth',
    AttFallbackPresenter: 'att', AppStack: 'app',
  };
  const compiled = ts.transpileModule(`${functionSource}\nreturn RootNavigator;`, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
    fileName: 'RootNavigator.tsx',
  }).outputText;
  const render = new Function(...Object.keys(dependencies), compiled)(...Object.values(dependencies));
  const retry = noop;
  gate = { status: 'connection_error', retry };
  assert.equal(render({}).type, 'connection-error');
  refIndex = 0;
  gate = { status: 'needs_onboarding' };
  assert.equal(render({}).type, 'onboarding');
  const savedGate = gate;
  for (const status of ['connection_error', 'booting']) {
    refIndex = 0;
    gate = { status, retry };
    const result = render({});
    assert.equal(result.type, 'onboarding');
    assert.equal(result.props.gate, savedGate);
  }
  refIndex = 0;
  gate = { status: 'signed_out' };
  assert.equal(render({}).type, 'auth');
});
