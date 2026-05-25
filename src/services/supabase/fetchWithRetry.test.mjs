import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithRetry } from './fetchWithRetry.ts';

const SUPABASE_URL = 'https://example.supabase.co/rest/v1';

function networkFailure() {
  return new TypeError('Network request failed');
}

test('fetchWithRetry retries idempotent heart-rate session RPC network failures', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      throw networkFailure();
    }
    return new Response(JSON.stringify('session-id'), { status: 200 });
  };

  try {
    const response = await fetchWithRetry(
      `${SUPABASE_URL}/rpc/complete_heart_rate_session`,
      { method: 'POST' },
    );

    assert.equal(response.status, 200);
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchWithRetry detects idempotent heart-rate RPC when input is a Request', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      throw networkFailure();
    }
    return new Response(JSON.stringify('session-id'), { status: 200 });
  };

  try {
    const request = new Request(
      `${SUPABASE_URL}/rpc/complete_heart_rate_session`,
      { method: 'POST' },
    );
    const response = await fetchWithRetry(request);

    assert.equal(response.status, 200);
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchWithRetry does not retry ordinary POST RPC network failures', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    throw networkFailure();
  };

  try {
    await assert.rejects(
      fetchWithRetry(`${SUPABASE_URL}/rpc/non_idempotent_rpc`, { method: 'POST' }),
      /Network request failed/,
    );
    assert.equal(attempts, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchWithRetry does not retry non-network errors for idempotent RPCs', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    throw new TypeError('Failed to parse URL');
  };

  try {
    await assert.rejects(
      fetchWithRetry(`${SUPABASE_URL}/rpc/complete_heart_rate_session`, { method: 'POST' }),
      /Failed to parse URL/,
    );
    assert.equal(attempts, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
