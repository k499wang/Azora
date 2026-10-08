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
  const methods = ['prepare', 'restart', 'stop', 'release'];
  if (overrides.schedule) methods.push('schedule');
  const native = Object.fromEntries(methods.map((method) => [
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

test('timed cues never wait behind audio preparation or replay after it', async () => {
  const preparation = deferred();
  const { playback, calls } = fixture({ prepare: () => preparation.promise, schedule: async () => {} });
  const target = Date.now() + 1000;
  assert.equal(playback.requestAt(target), false);
  playback.setActive(true);
  assert.equal(playback.requestAt(target), false);
  playback.setReady(true);
  await flush();
  assert.equal(playback.requestAt(target), false);
  preparation.resolve();
  await flush();
  assert.equal(playback.isPrimed(), true);
  assert.equal(count(calls, 'schedule'), 0);
  assert.equal(count(calls, 'restart'), 0);
});

test('primed timed cues dispatch unchanged shared-clock times without waiting for acknowledgements', async (t) => {
  t.mock.method(Date, 'now', () => 1000);
  const acknowledgement = deferred();
  const { playback, calls } = fixture({ schedule: () => acknowledgement.promise });
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  const targets = [1300, 1560, 1820];
  for (const target of targets) assert.equal(playback.requestAt(target), true);
  const schedules = calls.filter((call) => call[0] === 'schedule');
  assert.deepEqual(schedules.map((call) => call[3]), targets);
  assert.deepEqual(schedules.map((call) => call[2]), [0.45, 0.45, 0.45]);
  assert.equal(new Set(schedules.map((call) => call[1])).size, 1);
  assert.equal(count(calls, 'restart'), 0);
  acknowledgement.resolve();
  await flush();
  assert.equal(count(calls, 'schedule'), 3);
});

test('expired and invalid timed cues are rejected without a pending replay', async (t) => {
  t.mock.method(Date, 'now', () => 1000);
  const { playback, calls } = fixture({ schedule: async () => {} });
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  for (const target of [999, 1000, NaN, Infinity, -Infinity]) {
    assert.equal(playback.requestAt(target), false);
  }
  await flush();
  assert.equal(count(calls, 'schedule'), 0);
  assert.equal(count(calls, 'restart'), 0);
});

test('older binaries return false for timed cues while immediate playback still works', async () => {
  const { playback, calls } = fixture();
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  assert.equal(playback.requestAt(Date.now() + 1000), false);
  assert.equal(playback.request(), true);
  await flush();
  assert.equal(count(calls, 'restart'), 1);
});

test('ten scheduled focus cycles stop and release the same owner without replaying pending acknowledgements', async () => {
  const acknowledgement = deferred();
  const { playback, calls } = fixture({ schedule: () => acknowledgement.promise });
  playback.setReady(true);
  for (let cycle = 0; cycle < 10; cycle += 1) {
    playback.setActive(true);
    await flush();
    assert.equal(playback.requestAt(Date.now() + 1000), true);
    playback.setActive(false);
    assert.equal(playback.requestAt(Date.now() + 1000), false);
  }
  playback.dispose();
  assert.equal(playback.requestAt(Date.now() + 1000), false);
  acknowledgement.resolve();
  await flush();
  assert.equal(count(calls, 'prepare'), 1);
  assert.equal(count(calls, 'schedule'), 10);
  assert.equal(count(calls, 'stop'), 10);
  assert.equal(count(calls, 'release'), 1);
  assert.equal(count(calls, 'restart'), 0);
  const owners = calls.filter((call) => ['schedule', 'stop', 'release'].includes(call[0])).map((call) => call[1]);
  assert.equal(new Set(owners).size, 1);
});

test('failed timed dispatch reports errors without queuing an immediate restart', async () => {
  for (const synchronous of [false, true]) {
    const error = new Error('schedule failed');
    const native = {
      prepare: async () => {}, restart: async () => {}, stop: async () => {}, release: async () => {},
      schedule: () => { if (synchronous) throw error; return Promise.reject(error); },
    };
    const errors = [];
    const playback = createNativeCompletionSoundPlayback(native, async () => 'file:///completion.wav',
      async () => {}, (failure) => errors.push(failure));
    playback.setActive(true);
    playback.setReady(true);
    await flush();
    assert.equal(playback.requestAt(Date.now() + 1000), !synchronous);
    await flush();
    assert.deepEqual(errors, [error]);
  }
});
