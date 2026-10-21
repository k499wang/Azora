import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildQualifiedTrialEvent, qualifyTrial } from './qualifiedTrial.ts';
import { createQualifiedTrialHandler } from './worker.ts';

const purchase = Date.parse('2026-10-15T12:00:00Z');
const now = purchase + 10 * 60 * 1000;
const twoHours = purchase + 2 * 60 * 60 * 1000;
function v2Job(overrides = {}) {
  return job({ event_name: 'qualified_trial_v2', due_at: new Date(twoHours).toISOString(), ...overrides });
}
const uuid = '12345678-1234-1234-1234-123456789abc';
const cronSecret = 'cron-secret-012345678901234567890123456789';
function job(overrides = {}) {
  return {
    id: 'job-1', source_event_id: 'event-1', store: 'APP_STORE', app_user_id: 'user/1',
    product_id: 'annual', original_transaction_id: 'original-1', due_at: new Date(now).toISOString(),
    lease_token: 'lease-1', attempts: 1,
    payload: { event: { purchased_at_ms: purchase, subscriber_attributes: {
      $appsflyerId: { value: '1234567890123-1234567' },
      $attConsentStatus: { value: 'authorized' }, $idfa: { value: uuid },
    } } }, ...overrides,
  };
}
function subscriber(overrides = {}) {
  return {
    subscriptions: { annual: {
      is_sandbox: false, period_type: 'trial', store: 'app_store',
      purchase_date: new Date(purchase).toISOString(), expires_date: '2026-10-22T12:00:00Z',
      unsubscribe_detected_at: null, billing_issues_detected_at: null, refunded_at: null,
      ...overrides,
    } },
    subscriber_attributes: { $appsflyerId: { value: '1234567890123-7654321' } },
  };
}

test('only the same live production trial purchase qualifies after ten minutes', () => {
  assert.deepEqual(qualifyTrial(job(), subscriber(), now), { status: 'qualified' });
  assert.equal(qualifyTrial(job(), subscriber(), now - 1).status, 'pending');
  for (const mismatch of [
    { is_sandbox: true }, { store: 'play_store' }, { period_type: 'normal' },
    { unsubscribe_detected_at: '2026-10-15T12:02:00Z' },
    { billing_issues_detected_at: '2026-10-15T12:02:00Z' },
    { refunded_at: '2026-10-15T12:02:00Z' },
    { expires_date: new Date(now).toISOString() }, { expires_date: null },
    { purchase_date: '2026-10-14T12:00:00Z' },
  ]) assert.equal(qualifyTrial(job(), subscriber(mismatch), now).status, 'suppressed');
  const missing = subscriber();
  delete missing.subscriptions.annual;
  assert.equal(qualifyTrial(job(), missing, now).status, 'pending');
  const noAttributes = subscriber();
  delete noAttributes.subscriber_attributes;
  assert.equal(qualifyTrial(job(), noAttributes, now).status, 'pending');
});

test('payload is a non-revenue custom event timestamped at qualification', () => {
  const event = buildQualifiedTrialEvent(job(), subscriber());
  assert.equal(event.eventName, 'qualified_trial');
  assert.equal(event.bundleIdentifier, 'com.azora.breath');
  assert.equal(event.eventTime, '2026-10-15 12:10:00.000');
  assert.equal(event.appsflyer_id, '1234567890123-7654321');
  assert.deepEqual(JSON.parse(event.eventValue), {
    af_content_id: 'annual', original_transaction_id: 'original-1', qualification_minutes: 10,
    revenuecat_event_id: 'event-1',
  });
  assert.equal(JSON.stringify(event).includes('af_revenue'), false);
});

test('V2 qualifies at two hours and rejects an early due date or a cancellation after ten minutes', () => {
  assert.equal(qualifyTrial(v2Job(), subscriber(), twoHours - 1).status, 'pending');
  assert.deepEqual(qualifyTrial(v2Job(), subscriber(), twoHours), { status: 'qualified' });
  assert.equal(qualifyTrial(v2Job({ due_at: new Date(now).toISOString() }), subscriber(), twoHours - 1).status, 'pending');
  assert.equal(qualifyTrial(v2Job(), subscriber({
    unsubscribe_detected_at: new Date(purchase + 60 * 60 * 1000).toISOString(),
  }), twoHours).status, 'suppressed');
  assert.equal(qualifyTrial(v2Job(), subscriber({ expires_date: new Date(twoHours).toISOString() }), twoHours).status, 'suppressed');
  const event = buildQualifiedTrialEvent(v2Job(), subscriber());
  assert.equal(event.eventName, 'qualified_trial_v2');
  assert.equal(event.eventTime, '2026-10-15 14:00:00.000');
  assert.equal(JSON.parse(event.eventValue).qualification_minutes, 120);
  assert.equal(JSON.stringify(event).includes('af_revenue'), false);
});

test('uses live ATT and device IDs without stale consent fallback', () => {
  for (const [consent, expected] of [['authorized', 3], ['denied', 2], ['restricted', 1], ['notDetermined', 0], [undefined, 0]]) {
    const customer = subscriber();
    customer.subscriber_attributes.$attConsentStatus = { value: consent };
    customer.subscriber_attributes.$idfa = { value: uuid };
    customer.subscriber_attributes.$idfv = { value: uuid };
    const event = buildQualifiedTrialEvent(job(), customer);
    assert.equal(event.att, expected);
    assert.equal(event.idfa, expected === 3 ? uuid : undefined);
    assert.equal(event.idfv, uuid);
  }
  const customer = subscriber();
  customer.subscriber_attributes = {};
  const event = buildQualifiedTrialEvent(job(), customer);
  assert.equal(event.appsflyer_id, '1234567890123-1234567');
  assert.equal(event.idfa, undefined);
  assert.equal(event.att, 0);
});

test('preserves all supported sharing filters and fails closed for malformed filters', () => {
  for (const [value, expected] of [
    ['all', 'all'], ['["partner_1","partner_2"]', ['partner_1', 'partner_2']],
    ['partner_1,partner_2', ['partner_1', 'partner_2']], ['[invalid', 'all'],
    ['[1]', 'all'], [42, 'all'], ['[]', undefined],
  ]) {
    const customer = subscriber();
    customer.subscriber_attributes.$appsflyerSharingFilter = { value };
    assert.deepEqual(buildQualifiedTrialEvent(job(), customer).sharing_filter, expected);
  }
});

test('Android sends GAID without iOS IDs and zero UUIDs are omitted', () => {
  const customer = subscriber();
  customer.subscriber_attributes.$gpsAdId = { value: uuid };
  customer.subscriber_attributes.$idfv = { value: uuid };
  const event = buildQualifiedTrialEvent(job({ store: 'PLAY_STORE' }), customer);
  assert.equal(event.advertising_id, uuid);
  assert.equal(event.att, undefined);
  assert.equal(event.idfv, undefined);
  customer.subscriber_attributes.$gpsAdId.value = '00000000-0000-0000-0000-000000000000';
  assert.equal(buildQualifiedTrialEvent(job({ store: 'PLAY_STORE' }), customer).advertising_id, undefined);
});

test('only the live device IP is eligible for forwarding', () => {
  const customer = subscriber();
  const source = job();
  source.payload.event.subscriber_attributes.$ip = { value: '192.0.2.1' };
  assert.equal(buildQualifiedTrialEvent(source, customer).ip, undefined);
  customer.subscriber_attributes.$ip = { value: '198.51.100.10' };
  assert.equal(buildQualifiedTrialEvent(source, customer).ip, '198.51.100.10');
  customer.subscriber_attributes.$ip.value = '999.1.1.1';
  assert.equal(buildQualifiedTrialEvent(source, customer).ip, undefined);
});

function harness({ customer = subscriber(), prepare = true, providerStatus = 200, transportError = false,
  configOverrides = {}, jobs = [job()], revenueCatStatus = 200, currentTime = now } = {}) {
  const actions = [];
  const sentEvents = [];
  const config = { cronSecret, revenueCatKey: 'rc-secret', appsFlyerDevKey: 'af-secret',
    iosAppId: 'id123456789', ...configOverrides };
  const database = {
    async claim(stores) { actions.push('claim'); return jobs.filter((item) => stores.includes(item.store)); },
    async prepare() { actions.push('prepare'); return prepare; },
    async finish(_job, status, reason) { actions.push({ status, reason }); return true; },
  };
  const fetcher = async (url, options) => {
    if (url.startsWith('https://api.revenuecat.com/')) {
      actions.push('revenuecat');
      assert.equal(url.endsWith('/user%2F1'), true);
      assert.equal(options.headers.authorization, 'Bearer rc-secret');
      return Response.json({ subscriber: customer }, { status: revenueCatStatus });
    }
    assert.equal(url, `https://api2.appsflyer.com/inappevent/${JSON.parse(options.body).att === undefined ? config.androidAppId : config.iosAppId}`);
    assert.equal(options.headers.authentication, 'af-secret');
    actions.push('appsflyer');
    sentEvents.push(JSON.parse(options.body));
    if (transportError) throw new Error('Request timed out');
    return new Response('', { status: providerStatus });
  };
  const handler = createQualifiedTrialHandler(config, database, fetcher, () => currentTime);
  const request = (auth = `Bearer ${cronSecret}`, method = 'POST') => new Request('https://example.test', {
    method, headers: { authorization: auth },
  });
  return { actions, sentEvents, handler, request, database, config, fetcher };
}

test('worker authenticates and validates configuration before touching the queue', async () => {
  const valid = harness();
  assert.equal((await valid.handler(valid.request('Bearer wrong'))).status, 401);
  assert.equal((await valid.handler(valid.request(`Bearer ${cronSecret}`, 'GET'))).status, 405);
  assert.deepEqual(valid.actions, []);
  const invalid = harness({ configOverrides: { iosAppId: '123456789' } });
  assert.equal((await invalid.handler(invalid.request())).status, 503);
  assert.deepEqual(invalid.actions, []);
  const shortSecret = harness({ configOverrides: { cronSecret: 'short' } });
  assert.equal((await shortSecret.handler(shortSecret.request('Bearer short'))).status, 503);
  assert.deepEqual(shortSecret.actions, []);
});

test('worker checks the live subscription then atomically rechecks the cancellation ledger before sending', async () => {
  const h = harness();
  assert.equal((await h.handler(h.request())).status, 200);
  assert.deepEqual(h.actions, ['claim', 'revenuecat', 'prepare', 'appsflyer', { status: 'sent', reason: undefined }]);
  const cancelled = harness({ customer: subscriber({ unsubscribe_detected_at: '2026-10-15T12:02:00Z' }) });
  await cancelled.handler(cancelled.request());
  assert.equal(cancelled.actions.some((action) => action === 'appsflyer' || action === 'prepare'), false);
  assert.equal(cancelled.actions.at(-1).status, 'suppressed');
  // A cancellation arriving between the API check and prepare must prevent the external call.
  const freshCancellation = harness({ prepare: false });
  await freshCancellation.handler(freshCancellation.request());
  assert.deepEqual(freshCancellation.actions, ['claim', 'revenuecat', 'prepare']);
});

test('one worker sends both qualification versions as separate events for the same trial', async () => {
  const h = harness({ currentTime: twoHours, jobs: [job(), v2Job({ id: 'job-v2', lease_token: 'lease-v2' })] });
  const response = await h.handler(h.request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sent, 2);
  assert.deepEqual(h.sentEvents.map((event) => [event.eventName, JSON.parse(event.eventValue).qualification_minutes]).sort(),
    [['qualified_trial', 10], ['qualified_trial_v2', 120]]);
  assert.equal(h.sentEvents[0].customer_user_id, h.sentEvents[1].customer_user_id);
});

test('V2 sends the distinct two-hour event only after the live and ledger cancellation checks', async () => {
  const valid = harness({ jobs: [v2Job()], currentTime: twoHours });
  assert.equal((await valid.handler(valid.request())).status, 200);
  assert.equal(valid.sentEvents.length, 1);
  assert.equal(valid.sentEvents[0].eventName, 'qualified_trial_v2');
  assert.equal(JSON.parse(valid.sentEvents[0].eventValue).qualification_minutes, 120);
  assert.equal(valid.actions.at(-1).status, 'sent');
  for (const options of [
    { currentTime: twoHours - 1 },
    { customer: subscriber({ unsubscribe_detected_at: '2026-10-15T13:00:00Z' }) },
    { prepare: false },
  ]) {
    const blocked = harness({ jobs: [v2Job()], currentTime: twoHours, ...options });
    await blocked.handler(blocked.request());
    assert.equal(blocked.sentEvents.length, 0);
  }
});

test('pre-send failures retry, explicit rejection fails, and ambiguous delivery never automatically retries', async () => {
  for (const [options, expected] of [
    [{ revenueCatStatus: 429 }, 'pending'], [{ revenueCatStatus: 503 }, 'pending'],
    [{ providerStatus: 400 }, 'failed'], [{ providerStatus: 401 }, 'failed'],
    [{ providerStatus: 500 }, 'uncertain'], [{ transportError: true }, 'uncertain'],
  ]) {
    const h = harness(options);
    assert.equal((await h.handler(h.request())).status, 200);
    assert.equal(h.actions.at(-1).status, expected);
  }
});

test('missing identity retries before dispatch and oversized payloads never reach AppsFlyer', async () => {
  const customer = subscriber();
  customer.subscriber_attributes = {};
  const missing = job({ payload: { event: { purchased_at_ms: purchase } } });
  const h = harness({ customer, jobs: [missing] });
  await h.handler(h.request());
  assert.equal(h.actions.at(-1).status, 'pending');
  assert.equal(h.actions.includes('prepare'), false);
  assert.throws(() => buildQualifiedTrialEvent(job({ product_id: 'x'.repeat(2000) }), subscriber()), /1 KB/);
});

test('unconfigured Android jobs remain unclaimed while configured Android trials use the package ID', async () => {
  const androidJob = job({ store: 'PLAY_STORE' });
  const unconfigured = harness({ jobs: [androidJob] });
  const result = await unconfigured.handler(unconfigured.request());
  assert.equal((await result.json()).claimed, 0);
  assert.deepEqual(unconfigured.actions, ['claim']);
  const configured = harness({ jobs: [androidJob], customer: subscriber({ store: 'play_store' }),
    configOverrides: { androidAppId: 'com.azora.breath' } });
  assert.equal((await configured.handler(configured.request())).status, 200);
  assert.equal(configured.actions.includes('appsflyer'), true);
  assert.equal(configured.actions.at(-1).status, 'sent');
});

test('last pre-dispatch failure reports failed, matching the durable retry limit', async () => {
  const h = harness({ jobs: [job({ attempts: 5 })], revenueCatStatus: 503 });
  const result = await h.handler(h.request());
  const counts = await result.json();
  assert.equal(counts.failed, 1);
  assert.equal(counts.pending, 0);
  assert.equal(h.actions.at(-1).status, 'failed');
});

test('malformed live data and non-finite source timestamps cannot dispatch', async () => {
  for (const customer of [{}, { subscriptions: [] }, { subscriptions: subscriber().subscriptions },
    { ...subscriber(), subscriber_attributes: [] }]) {
    const h = harness({ customer });
    await h.handler(h.request());
    assert.equal(h.actions.includes('appsflyer'), false);
  }
  assert.equal(qualifyTrial(job({ due_at: 'invalid' }), subscriber(), now).status, 'pending');
  const malformed = job();
  malformed.payload.event.purchased_at_ms = Number.NaN;
  assert.equal(qualifyTrial(malformed, subscriber(), now).status, 'suppressed');
});

test('RevenueCat transport and response-body deadlines retry before any AppsFlyer request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const stalledBody of [false, true]) {
    const h = harness();
    const started = Promise.withResolvers();
    const fetcher = async (_url, options) => {
      const stalled = () => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
        started.resolve();
      });
      return stalledBody ? { ok: true, json: stalled } : stalled();
    };
    const handler = createQualifiedTrialHandler(h.config, h.database, fetcher, () => now);
    const result = handler(h.request());
    await started.promise;
    t.mock.timers.tick(8000);
    assert.equal((await result).status, 200);
    assert.equal(h.actions.at(-1).status, 'pending');
    assert.equal(h.actions.includes('prepare'), false);
  }
});

test('AppsFlyer deadline records uncertain delivery without retrying the request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness();
  const started = Promise.withResolvers();
  let externalCalls = 0;
  const fetcher = async (url, options) => {
    if (url.startsWith('https://api.revenuecat.com/')) return h.fetcher(url, options);
    externalCalls += 1;
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      started.resolve();
    });
  };
  const handler = createQualifiedTrialHandler(h.config, h.database, fetcher, () => now);
  const result = handler(h.request());
  await started.promise;
  t.mock.timers.tick(8000);
  assert.equal((await result).status, 200);
  assert.equal(externalCalls, 1);
  assert.equal(h.actions.at(-1).status, 'uncertain');
});

test('lost dispatch lease and preparation errors prevent the external request', async () => {
  const h = harness();
  h.database.prepare = async () => { throw new Error('Database request timed out'); };
  await h.handler(h.request());
  assert.equal(h.actions.includes('appsflyer'), false);
  assert.equal(h.actions.at(-1).status, 'pending');
  const lost = harness({ revenueCatStatus: 503 });
  lost.database.finish = async () => false;
  assert.equal((await lost.handler(lost.request())).status, 500);
  assert.equal(lost.actions.includes('appsflyer'), false);
});

test('an unavailable outcome write becomes uncertain after a send and never resends', async () => {
  const h = harness();
  const finish = h.database.finish;
  h.database.finish = async (claimed, outcome, reason) => {
    if (outcome === 'sent') throw new Error('Outcome write failed');
    return finish(claimed, outcome, reason);
  };
  assert.equal((await h.handler(h.request())).status, 200);
  assert.equal(h.actions.at(-1).status, 'uncertain');
  assert.equal(h.actions.filter((action) => action === 'appsflyer').length, 1);
});

test('a database failure does not abandon other jobs already claimed in the same batch', async () => {
  const h = harness({ jobs: [job(), job({ id: 'job-2', source_event_id: 'event-2', lease_token: 'lease-2' })] });
  const started = Promise.withResolvers();
  const release = Promise.withResolvers();
  const finish = h.database.finish;
  h.database.finish = async (claimed, outcome, reason) => {
    if (claimed.id === 'job-1') throw new Error('Database unavailable');
    started.resolve();
    await release.promise;
    return finish(claimed, outcome, reason);
  };
  let resolved = false;
  const result = h.handler(h.request()).then((response) => { resolved = true; return response; });
  await started.promise;
  assert.equal(resolved, false);
  release.resolve();
  assert.equal((await result).status, 500);
  assert.equal(h.actions.filter((action) => action === 'appsflyer').length, 2);
  assert.equal(h.actions.at(-1).status, 'sent');
});
