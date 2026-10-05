import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompletionSoundPlayback } from './completionSoundPlayback.ts';

const flush = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function fixture({ configure = async () => {}, seek = async () => {}, play = () => {} } = {}) {
  const calls = [];
  const errors = [];
  const player = {
    volume: 0,
    pause() { calls.push('pause'); },
    async seekTo(seconds, toleranceBefore, toleranceAfter) {
      calls.push(['seek', seconds, toleranceBefore, toleranceAfter]);
      await seek();
    },
    play() { calls.push('play'); play(); },
  };
  const playback = createCompletionSoundPlayback(player, async () => {
    calls.push('configure');
    await configure();
  }, (error) => errors.push(error));
  return { playback, player, calls, errors };
}

test('inactive requests are rejected', async () => {
  const { playback, calls } = fixture();
  playback.setReady(true);
  assert.equal(playback.request(), false);
  await flush();
  assert.deepEqual(calls, []);
});

test('loading requests collapse into one cue once ready', async () => {
  const { playback, calls, player } = fixture();
  playback.setActive(true);
  assert.equal(playback.request(), true);
  playback.request();
  playback.request();
  assert.deepEqual(calls, []);
  playback.setReady(true);
  await flush();
  assert.deepEqual(calls, ['configure', ['seek', 0, 0, 0], 'play']);
  assert.equal(player.volume, 0.45);
  playback.setReady(true);
  await flush();
  assert.equal(calls.filter((call) => call === 'play').length, 1);
});

test('cancellation discards loading cues', async () => {
  const { playback, calls } = fixture();
  playback.setActive(true);
  playback.request();
  playback.cancel();
  playback.setReady(true);
  await flush();
  assert.deepEqual(calls, ['pause', 'configure']);
});

test('deactivation during configuration prevents seeking or playback', async () => {
  const configuration = deferred();
  const { playback, calls } = fixture({ configure: () => configuration.promise });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  playback.setActive(false);
  configuration.resolve();
  await flush();
  assert.deepEqual(calls, ['configure', 'pause']);
});

test('cancellation during seeking prevents playback', async () => {
  const seeking = deferred();
  const { playback, calls } = fixture({ seek: () => seeking.promise });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  playback.cancel();
  seeking.resolve();
  await flush();
  assert.deepEqual(calls, ['configure', ['seek', 0, 0, 0], 'pause']);
});

test('rapid ready requests share preparation and only the newest cue plays', async () => {
  const configuration = deferred();
  const { playback, calls } = fixture({ configure: () => configuration.promise });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  playback.request();
  configuration.resolve();
  await flush();
  assert.deepEqual(calls, ['configure', ['seek', 0, 0, 0], 'play']);
});

test('preparation happens before taps and repeated cues do not reconfigure or pause', async () => {
  const { playback, calls } = fixture();
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  assert.deepEqual(calls, ['configure']);
  for (let tick = 0; tick < 10; tick++) {
    playback.request();
    await flush();
  }
  assert.equal(calls.filter((call) => call === 'configure').length, 1);
  assert.equal(calls.filter((call) => call === 'pause').length, 0);
  assert.equal(calls.filter((call) => call === 'play').length, 10);
  playback.setActive(false);
  playback.setActive(true);
  await flush();
  assert.equal(calls.filter((call) => call === 'configure').length, 2);
});

test('ten completed cycles leave no retained cue', async () => {
  const { playback, calls } = fixture();
  playback.setReady(true);
  for (let cycle = 0; cycle < 10; cycle += 1) {
    playback.setActive(true);
    playback.request();
    await flush();
    playback.setActive(false);
  }
  playback.setActive(true);
  playback.setReady(true);
  await flush();
  assert.equal(calls.filter((call) => call === 'play').length, 10);
});

test('configuration and seek errors are reported without playback', async () => {
  for (const stage of ['configure', 'seek']) {
    const error = new Error(stage);
    const { playback, calls, errors } = fixture({
      [stage]: async () => { throw error; },
    });
    playback.setActive(true);
    playback.setReady(true);
    playback.request();
    await flush();
    assert.deepEqual(errors, [error]);
    assert.equal(calls.includes('play'), false);
  }
});

test('native and diagnostic exceptions do not escape', async () => {
  const error = new Error('released');
  const playback = createCompletionSoundPlayback({
    volume: 0,
    pause() { throw error; },
    seekTo: async () => {},
    play() { throw error; },
  }, async () => {}, () => { throw new Error('diagnostic'); });
  playback.setActive(true);
  playback.setReady(true);
  assert.equal(playback.request(), true);
  await flush();
  assert.doesNotThrow(() => playback.cancel());
});

test('native play errors are reported', async () => {
  const error = new Error('play failed');
  const errors = [];
  const playback = createCompletionSoundPlayback({
    volume: 0,
    pause() {},
    seekTo: async () => {},
    play() { throw error; },
  }, async () => {}, (failure) => errors.push(failure));
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  assert.deepEqual(errors, [error]);
});

test('rapid taps serialize exact seeks and only play the latest request', async () => {
  const firstSeek = deferred();
  const latestSeek = deferred();
  let seekCount = 0;
  const { playback, calls, player } = fixture({
    seek: () => ++seekCount === 1 ? firstSeek.promise : latestSeek.promise,
  });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  for (let tap = 0; tap < 10; tap += 1) assert.equal(playback.request(), true);
  await flush();
  assert.equal(seekCount, 1);
  assert.equal(player.volume, 0);
  firstSeek.resolve();
  await flush();
  assert.equal(seekCount, 2);
  assert.equal(calls.includes('play'), false);
  latestSeek.resolve();
  await flush();
  assert.deepEqual(calls, ['configure', ['seek', 0, 0, 0], ['seek', 0, 0, 0], 'play']);
  assert.equal(player.volume, 0.45);
});

test('repeated rapid restart cycles silence immediately and resume one complete cue', async () => {
  let currentSeek;
  const { playback, player, calls } = fixture({ seek: () => currentSeek.promise });
  playback.setActive(true);
  playback.setReady(true);
  for (let cycle = 0; cycle < 10; cycle += 1) {
    currentSeek = deferred();
    playback.request();
    assert.equal(player.volume, 0);
    await flush();
    for (let tap = 0; tap < 5; tap += 1) playback.request();
    currentSeek.resolve();
    await flush();
    assert.equal(player.volume, 0.45);
    assert.equal(calls.filter((call) => call === 'play').length, cycle + 1);
  }
  assert.equal(calls.filter((call) => call === 'pause').length, 0);
});

test('cancellation and reactivation keep native seeks serialized', async () => {
  const oldSeek = deferred();
  const newSeek = deferred();
  let seekCount = 0;
  const { playback, calls } = fixture({
    seek: () => ++seekCount === 1 ? oldSeek.promise : newSeek.promise,
  });
  playback.setActive(true);
  playback.setReady(true);
  playback.request();
  await flush();
  playback.setActive(false);
  playback.setActive(true);
  playback.request();
  await flush();
  assert.equal(seekCount, 1);
  oldSeek.resolve();
  await flush();
  assert.equal(seekCount, 2);
  assert.equal(calls.includes('play'), false);
  newSeek.resolve();
  await flush();
  assert.equal(calls.filter((call) => call === 'play').length, 1);
});

test('configuration, seek, and play failures allow a later restart', async () => {
  for (const stage of ['configure', 'seek', 'play']) {
    const error = new Error(stage);
    let fail = true;
    const { playback, calls, player, errors } = fixture({
      [stage]: () => { if (fail) throw error; },
    });
    playback.setActive(true);
    playback.setReady(true);
    playback.request();
    await flush();
    assert.deepEqual(errors, [error]);
    fail = false;
    assert.equal(playback.request(), true);
    await flush();
    assert.equal(calls.at(-1), 'play');
    assert.equal(player.volume, 0.45);
  }
});
