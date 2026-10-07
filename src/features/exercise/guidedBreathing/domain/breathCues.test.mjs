import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { breathCueSounds } from './breathCues.ts';

test('long phases get the full two-note cue', () => {
  assert.deepEqual(breathCueSounds({ inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 }), {
    inhale: 'breathInhale',
    exhale: 'breathExhale',
  });
});

test('fast techniques get the cue cut to their phase length', () => {
  assert.deepEqual(breathCueSounds({ inhale: 2, holdIn: 0, exhale: 2, holdOut: 0 }), {
    inhale: 'breathInhale2s',
    exhale: 'breathExhale2s',
  });
  assert.deepEqual(breathCueSounds({ inhale: 1, holdIn: 0, exhale: 1, holdOut: 0 }), {
    inhale: 'breathInhale1s',
    exhale: 'breathExhale1s',
  });
});

test('inhale and exhale are sized independently', () => {
  assert.deepEqual(breathCueSounds({ inhale: 4, holdIn: 0, exhale: 2, holdOut: 0 }), {
    inhale: 'breathInhale',
    exhale: 'breathExhale2s',
  });
});

function wavSeconds(name) {
  const wav = readFileSync(new URL(`../../../../../assets/audio/effects/${name}.wav`, import.meta.url));
  let rate;
  let bytes;
  for (let offset = 12; offset + 8 <= wav.length;) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (id === 'fmt ') rate = wav.readUInt32LE(offset + 12);
    if (id === 'data') bytes = size;
    offset += 8 + size + (size % 2);
  }
  assert.equal(rate, 48000);
  return bytes / 2 / rate;
}

test('every short cue ends before the phase it marks', () => {
  for (const breath of ['inhale', 'exhale']) {
    assert.ok(wavSeconds(`breath-${breath}-2s`) < 2);
    assert.ok(wavSeconds(`breath-${breath}-1s`) < 1);
    assert.ok(wavSeconds(`breath-${breath}`) < 3);
  }
});
