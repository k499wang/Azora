import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { getUserEntitlementQueryKey, publishRevenueCatEntitlement } from './entitlementCache.ts';
import { PRO_ENTITLEMENT } from '../../services/subscriptions/entitlementResolution.ts';
import { isPlanDayGated } from '../../features/plan/domain/planDayGate.ts';
import { isPlanWeekLocked } from '../../features/plan/domain/planPath.ts';

const activeCustomerInfo = {
  entitlements: { active: { [PRO_ENTITLEMENT]: {
    isActive: true,
    productIdentifier: 'azora.pro.annual',
    expirationDate: '2027-01-01T00:00:00Z',
    periodType: 'TRIAL',
    willRenew: true,
    store: 'APP_STORE',
  } } },
};

test('purchase and restore publish Pro to all mounted gates without a backend refetch', async () => {
  for (const flow of ['purchase', 'restore']) {
    const client = new QueryClient();
    const queryKey = getUserEntitlementQueryKey('user-1');
    client.setQueryData(queryKey, { isPro: false });
    let fetches = 0;
    const observer = new QueryObserver(client, {
      queryKey,
      staleTime: Infinity,
      queryFn: async () => { fetches += 1; return { isPro: false }; },
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      assert.equal(isPlanDayGated(observer.getCurrentResult().data.isPro, 4), true);
      assert.equal(isPlanWeekLocked(2, observer.getCurrentResult().data.isPro), true);
      assert.equal(await publishRevenueCatEntitlement(
        client, 'user-1', activeCustomerInfo, () => true,
      ), true, flow);
      const { data, isFetching } = observer.getCurrentResult();
      assert.equal(data.isPro, true);
      assert.equal(isPlanDayGated(data.isPro, 4), false);
      assert.equal(isPlanWeekLocked(2, data.isPro), false);
      assert.equal(data.trialEndsAt, '2027-01-01T00:00:00Z');
      assert.equal(isFetching, false);
      assert.equal(fetches, 0);
    } finally {
      unsubscribe();
      client.clear();
    }
  }
});

test('confirmed Pro seeds an entitlement query that has never mounted', async () => {
  const client = new QueryClient();
  try {
    await publishRevenueCatEntitlement(client, 'user-1', activeCustomerInfo, () => true);
    assert.equal(client.getQueryData(getUserEntitlementQueryKey('user-1')).isPro, true);
  } finally { client.clear(); }
});

test('a delayed pre-purchase free read cannot overwrite confirmed Pro', async () => {
  const client = new QueryClient();
  const queryKey = getUserEntitlementQueryKey('user-1');
  let finishFreeRead;
  const freeRead = new Promise((resolve) => { finishFreeRead = resolve; });
  const request = client.fetchQuery({ queryKey, queryFn: () => freeRead }).catch(() => {});
  try {
    await publishRevenueCatEntitlement(client, 'user-1', activeCustomerInfo, () => true);
    finishFreeRead({ isPro: false });
    await request;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(client.getQueryData(queryKey).isPro, true);
  } finally { client.clear(); }
});

test('account change during cancellation cannot publish the old user entitlement', async () => {
  const client = new QueryClient();
  let checks = 0;
  try {
    assert.equal(await publishRevenueCatEntitlement(
      client, 'user-1', activeCustomerInfo, () => ++checks === 1,
    ), false);
    assert.equal(client.getQueryData(getUserEntitlementQueryKey('user-1')), undefined);
    assert.equal(client.getQueryData(getUserEntitlementQueryKey('user-2')), undefined);
  } finally { client.clear(); }
});

test('missing Pro or an obsolete user never grants access', async () => {
  const client = new QueryClient();
  const queryKey = getUserEntitlementQueryKey('user-1');
  client.setQueryData(queryKey, { isPro: false });
  try {
    assert.equal(await publishRevenueCatEntitlement(
      client, 'user-1', { entitlements: { active: {} } }, () => true,
    ), false);
    assert.equal(await publishRevenueCatEntitlement(
      client, 'user-1', activeCustomerInfo, () => false,
    ), false);
    assert.equal(client.getQueryData(queryKey).isPro, false);
  } finally { client.clear(); }
});

test('ten foreground updates retain one user query and preserve backend attribution', async () => {
  const client = new QueryClient();
  const queryKey = getUserEntitlementQueryKey('user-1');
  client.setQueryData(queryKey, { isPro: false, experimentId: 'pricing-test' });
  try {
    for (let cycle = 0; cycle < 10; cycle += 1) {
      await publishRevenueCatEntitlement(client, 'user-1', activeCustomerInfo, () => true);
      assert.equal(client.getQueryData(queryKey).isPro, true);
      assert.equal(client.getQueryData(queryKey).experimentId, 'pricing-test');
    }
    assert.equal(client.getQueryCache().getAll().length, 1);
  } finally { client.clear(); }
});
