import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionBpmSampler } from './sessionBpmSampler.ts';

const reading = (bpm) => ({ bpm, signalQuality: 0.8 });

test('session BPM sampler uses exact one-second frame-timestamp slots', () => {
  const sampler = createSessionBpmSampler();
  sampler.start(10_000, reading(70));
  sampler.observe(10_999, reading(71));
  sampler.observe(11_000, reading(72));
  sampler.observe(12_000, reading(73));

  assert.deepEqual(sampler.finish(), [
    { offsetMs: 0, bpm: 70, signalQuality: 0.8 },
    { offsetMs: 1_000, bpm: 72, signalQuality: 0.8 },
    { offsetMs: 2_000, bpm: 73, signalQuality: 0.8 },
  ]);
});

test('session BPM sampler advances an ineligible slot without backfilling it', () => {
  const sampler = createSessionBpmSampler();
  sampler.start(5_000, reading(70));
  sampler.observe(6_000, null);
  sampler.observe(6_500, reading(90));
  sampler.observe(7_000, reading(72));

  assert.deepEqual(sampler.finish().map((sample) => sample.offsetMs), [0, 2_000]);
});

test('session BPM sampler emits only the latest due slot after a multi-slot gap', () => {
  const sampler = createSessionBpmSampler();
  sampler.start(1_000, null);
  sampler.observe(4_450, reading(75));

  assert.deepEqual(sampler.finish(), [
    { offsetMs: 3_000, bpm: 75, signalQuality: 0.8 },
  ]);
});

test('session BPM sampler finish is defensive and returns detached samples', () => {
  const sampler = createSessionBpmSampler();
  assert.deepEqual(sampler.finish(), []);

  sampler.start(Number.NaN, reading(70));
  sampler.observe(1_000, reading(71));
  assert.deepEqual(sampler.finish(), []);
  assert.deepEqual(sampler.finish(), []);
});
