import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('the streak cue retains its quiet decay and ends without a hard cut', () => {
  const wav = readFileSync(new URL('../../../assets/audio/effects/streak-continue.wav', import.meta.url));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  let rate;
  let samples;
  for (let offset = 12; offset + 8 <= wav.length;) {
    const name = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (name === 'fmt ') {
      assert.equal(wav.readUInt16LE(start), 1);
      assert.equal(wav.readUInt16LE(start + 2), 1);
      assert.equal(wav.readUInt16LE(start + 14), 16);
      rate = wav.readUInt32LE(start + 4);
    }
    if (name === 'data') samples = wav.subarray(start, start + size);
    offset = start + size + (size % 2);
  }
  assert.ok(rate && samples);
  const duration = samples.length / 2 / rate;
  assert.ok(duration >= 1, 'The original decay must survive beyond the old 512 ms trim');
  const peak = (start, end) => {
    let value = 0;
    for (let frame = Math.floor(start * rate); frame < Math.floor(end * rate); frame++) {
      value = Math.max(value, Math.abs(samples.readInt16LE(frame * 2)));
    }
    return value;
  };
  assert.ok(peak(0.55, 0.65) > 40, 'Keep the soft tail after the previous cut point');
  assert.ok(peak(duration - 0.02, duration) < 20, 'The file should finish quietly');
});
