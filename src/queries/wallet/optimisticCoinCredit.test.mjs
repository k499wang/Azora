import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { MutationObserver, QueryClient } from '@tanstack/react-query';

const walletKey = ['wallet', 'user', 'coin'];

function loadHelper() {
  const exports = {};
  const compiled = ts.transpileModule(
    readFileSync(new URL('./optimisticCoinCredit.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name.endsWith('useWalletQuery')) return { getWalletQueryKey: () => walletKey };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports.optimisticCoinCredit;
}

function observe(client, coinsFor, write) {
  const optimisticCoinCredit = loadHelper();
  const observer = new MutationObserver(client, {
    mutationFn: write,
    ...optimisticCoinCredit(client, 'user', coinsFor),
  });
  return observer;
}

test('credits the balance inside mutate, before the write settles', async () => {
  const client = new QueryClient();
  client.setQueryData(walletKey, 100);
  let finish;
  const write = new Promise((resolve) => { finish = resolve; });
  const observer = observe(client, () => 20, () => write);

  const pending = observer.mutate({});
  assert.equal(client.getQueryData(walletKey), 120);

  finish();
  await pending;
  assert.equal(client.getQueryData(walletKey), 120);
  assert.equal(client.getQueryState(walletKey).isInvalidated, true);
});

test('takes the credit back when the write fails, after its screen has gone', async () => {
  const client = new QueryClient();
  client.setQueryData(walletKey, 100);
  let fail;
  const write = new Promise((_, reject) => { fail = reject; });
  const observer = observe(client, () => 20, () => write);
  const unsubscribe = observer.subscribe(() => {});

  const pending = observer.mutate({}).catch(() => {});
  unsubscribe();
  fail(new Error('offline'));
  await pending;

  assert.equal(client.getQueryData(walletKey), 100);
  assert.equal(client.getQueryState(walletKey).isInvalidated, true);
});

test('a write that earns nothing leaves the balance alone', async () => {
  const client = new QueryClient();
  client.setQueryData(walletKey, 100);
  const observer = observe(client, () => 0, async () => {});

  const pending = observer.mutate({});
  assert.equal(client.getQueryData(walletKey), 100);
  await pending;
  assert.equal(client.getQueryData(walletKey), 100);
});

test('an unloaded balance stays unloaded', async () => {
  const client = new QueryClient();
  const observer = observe(client, () => 20, async () => {});

  await observer.mutate({});
  assert.equal(client.getQueryData(walletKey), undefined);
});
