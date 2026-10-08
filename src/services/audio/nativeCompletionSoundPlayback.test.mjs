import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeCompletionSoundPlayback } from './nativeCompletionSoundPlayback.ts';

const flush = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function fixture(overrides = {}) {
  const calls = [];
  const errors = [];
  const native = Object.fromEntries(['prepare', 'restart', 'stop', 'release'].map((method) => [
    method, async (...args) => {
      calls.push([method, ...args]);
      await overrides[method]?.(...args);
    },
  ]));
  const playback = createNativeCompletionSoundPlayback(native, async () => {
    calls.push(['asset']);
    return overrides.asset ? await overrides.asset() : 'file:///completion.wav';
  }, async () => {
    calls.push(['configure']);
    await overrides.configure?.();
  }, (error) => errors.push(error));
  return { playback, calls, errors };
}
const count = (calls, method) => calls.filter((call) => call[0] === method).length;

test('a failed mode preparation on return cannot replay a cached player until retry succeeds', async () => {
  let fail = false;
  const { playback, calls, errors } = fixture({ configure: async () => {
    if (fail) throw new Error('mode failed');
  } });
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  playback.setActive(false);
  fail = true;
  playback.setActive(true);
  playback.request();
  await flush();
  assert.equal(errors.length, 1);
  assert.equal(count(calls, 'restart'), 0);
  fail = false;
  playback.request();
  await flush();
  assert.equal(count(calls, 'restart'), 1);
  assert.equal(count(calls, 'prepare'), 1);
});

test('native completion waits for readiness, configuration, asset, and preparation', async () => {
  const configure = deferred();
  const asset = deferred();
  const prepare = deferred();
  const { playback, calls } = fixture({
    configure: () => configure.promise,
    asset: () => asset.promise,
    prepare: () => prepare.promise,
  });
  assert.equal(playback.request(), false);
  playback.setActive(true);
  for (let tap = 0; tap < 10; tap += 1) assert.equal(playback.request(), true);
  assert.deepEqual(calls, []);
  playback.setReady(true);
  await flush();
  assert.deepEqual(calls, [['configure']]);
  configure.resolve();
  await flush();
  assert.equal(count(calls, 'asset'), 1);
  assert.equal(count(calls, 'restart'), 0);
  asset.resolve('file:///loaded.wav');
  await flush();
  assert.equal(calls.find((call) => call[0] === 'prepare')[2], 'file:///loaded.wav');
  assert.equal(count(calls, 'restart'), 0);
  prepare.resolve();
  await flush();
  assert.equal(count(calls, 'restart'), 1);
  assert.equal(calls.at(-1)[2], 0.45);
});

test('every ready tap dispatches its native restart without waiting for callback completion', async () => {
  const commands = Array.from({ length: 4 }, deferred);
  let restarts = 0;
  const { playback, calls } = fixture({ restart: () => commands[restarts++].promise });
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  for (let tap = 0; tap < 4; tap += 1) assert.equal(playback.request(), true);
  assert.equal(restarts, 4);
  assert.equal(count(calls, 'restart'), 4);
  for (const command of commands.toReversed()) command.resolve();
  await flush();
  assert.equal(restarts, 4);
  assert.equal(count(calls, 'configure'), 1);
  assert.equal(count(calls, 'prepare'), 1);
});

test('deactivation stops native playback with no JavaScript restart queued behind pending callbacks', async () => {
  const restart = deferred();
  const { playback, calls } = fixture({ restart: () => restart.promise });
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  playback.request();
  playback.request();
  playback.setActive(false);
  assert.equal(playback.request(), false);
  restart.resolve();
  await flush();
  assert.equal(count(calls, 'restart'), 2);
  assert.equal(count(calls, 'stop'), 1);
  assert.equal(calls.find((call) => call[0] === 'restart')[1], calls.find((call) => call[0] === 'stop')[1]);
});

test('dispose releases its owner once and prevents late preparation from playing', async () => {
  const preparation = deferred();
  const { playback, calls } = fixture({ prepare: () => preparation.promise });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  playback.dispose();
  playback.dispose();
  preparation.resolve();
  playback.setActive(true);
  assert.equal(playback.request(), false);
  await flush();
  assert.equal(count(calls, 'release'), 1);
  assert.equal(count(calls, 'restart'), 0);
  assert.equal(calls.find((call) => call[0] === 'prepare')[1], calls.find((call) => call[0] === 'release')[1]);
});

test('native preparation failures are reported and retry on the next request', async () => {
  let failing = true;
  const error = new Error('native prepare failed');
  const { playback, calls, errors } = fixture({ prepare: () => { if (failing) throw error; } });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  assert.deepEqual(errors, [error]);
  assert.equal(count(calls, 'restart'), 0);
  failing = false;
  assert.equal(playback.request(), true);
  await flush();
  assert.equal(count(calls, 'prepare'), 2);
  assert.equal(count(calls, 'restart'), 1);
});

test('deactivation during asset loading prevents preparation and playback', async () => {
  const asset = deferred();
  const { playback, calls } = fixture({ asset: () => asset.promise });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  playback.setActive(false);
  asset.resolve('file:///loaded.wav');
  await flush();
  assert.equal(count(calls, 'stop'), 1);
  assert.equal(count(calls, 'prepare'), 0);
  assert.equal(count(calls, 'restart'), 0);
});

test('native restart failure is reported and later taps can restart', async () => {
  let failing = true;
  const error = new Error('restart failed');
  const { playback, calls, errors } = fixture({ restart: () => { if (failing) throw error; } });
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  playback.request();
  await flush();
  assert.deepEqual(errors, [error]);
  failing = false;
  playback.request();
  await flush();
  assert.equal(count(calls, 'restart'), 2);
  assert.equal(count(calls, 'prepare'), 1);
});

test('ten focus cycles reuse one native owner and one prepared asset', async () => {
  const { playback, calls } = fixture();
  playback.setReady(true);
  for (let cycle = 0; cycle < 10; cycle += 1) {
    playback.setActive(true);
    playback.request();
    await flush();
    playback.setActive(false);
    await flush();
  }
  playback.dispose();
  await flush();
  assert.equal(count(calls, 'prepare'), 1);
  assert.equal(count(calls, 'asset'), 1);
  assert.equal(count(calls, 'restart'), 10);
  assert.equal(count(calls, 'stop'), 10);
  assert.equal(count(calls, 'release'), 1);
  const owners = calls.filter((call) => ['prepare', 'restart', 'stop', 'release'].includes(call[0])).map((call) => call[1]);
  assert.equal(new Set(owners).size, 1);
});

test('native completion is primed only once its voice is prepared', async () => {
  const prepare = deferred();
  const { playback } = fixture({ prepare: () => prepare.promise });
  playback.setActive(true);
  assert.equal(playback.isPrimed(), false);
  playback.setReady(true);
  await flush();
  assert.equal(playback.isPrimed(), false);
  prepare.resolve();
  await flush();
  assert.equal(playback.isPrimed(), true);
  playback.dispose();
  assert.equal(playback.isPrimed(), false);
});
