import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readEffect(name) {
  const wav = readFileSync(new URL(`../../../assets/audio/effects/${name}`, import.meta.url));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  let rate;
  let samples;
  for (let offset = 12; offset + 8 <= wav.length;) {
    const chunk = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (chunk === 'fmt ') {
      assert.equal(wav.readUInt16LE(start), 1, `${name} must be PCM`);
      assert.equal(wav.readUInt16LE(start + 2), 1, `${name} must be mono`);
      assert.equal(wav.readUInt16LE(start + 14), 16, `${name} must be 16-bit`);
      rate = wav.readUInt32LE(start + 4);
    }
    if (chunk === 'data') samples = wav.subarray(start, start + size);
    offset = start + size + (size % 2);
  }
  assert.ok(rate && samples);
  const duration = samples.length / 2 / rate;
  const peak = (from, to) => {
    let value = 0;
    for (let frame = Math.floor(from * rate); frame < Math.floor(to * rate); frame++) {
      value = Math.max(value, Math.abs(samples.readInt16LE(frame * 2)));
    }
    return value;
  };
  return { rate, duration, peak };
}

test('the streak cue retains its quiet decay and ends without a hard cut', () => {
  const { duration, peak } = readEffect('streak-continue.wav');
  assert.ok(duration >= 1, 'The original decay must survive beyond the old 512 ms trim');
  assert.ok(peak(0.55, 0.65) > 40, 'Keep the soft tail after the previous cut point');
  assert.ok(peak(duration - 0.02, duration) < 20, 'The file should finish quietly');
});

for (const name of ['path-tap.wav', 'path-stamp.wav', 'path-unlock.wav', 'path-gold.wav']) {
  test(`${name} is 48 kHz mono 16-bit PCM and ends quietly`, () => {
    const { rate, duration, peak } = readEffect(name);
    assert.equal(rate, 48000);
    assert.ok(peak(duration - 0.02, duration) < 20, 'The file should finish quietly');
  });
}
