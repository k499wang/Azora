import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameRecorder, parseFrameRecording } from './frameRecording.ts';

function makeFrame(timestamp, r = 150) {
  return {
    timestamp,
    rois: [
      { id: 'full', r, g: 20, b: 10, saturatedPct: 0, darkPct: 0, variance: 50 },
    ],
  };
}

test('frameRecorder: serialize/parse round-trips frames', () => {
  const recorder = createFrameRecorder();
  recorder.push(makeFrame(0));
  recorder.push(makeFrame(33));
  recorder.push(makeFrame(66));

  const recording = parseFrameRecording(recorder.serialize(new Date('2026-07-13T00:00:00Z')));
  assert.equal(recording.version, 1);
  assert.equal(recording.recordedAt, '2026-07-13T00:00:00.000Z');
  assert.equal(recording.frames.length, 3);
  assert.deepEqual(recording.frames[1], makeFrame(33));
});

test('frameRecorder: trims frames older than the max duration', () => {
  const recorder = createFrameRecorder(1000);
  for (let t = 0; t <= 3000; t += 100) {
    recorder.push(makeFrame(t));
  }
  assert.equal(recorder.durationMs(), 1000);
  const recording = parseFrameRecording(recorder.serialize());
  assert.equal(recording.frames[0].timestamp, 2000);
  assert.equal(recording.frames[recording.frames.length - 1].timestamp, 3000);
});

test('frameRecorder: a backwards clock jump starts a fresh recording', () => {
  const recorder = createFrameRecorder();
  recorder.push(makeFrame(50_000));
  recorder.push(makeFrame(50_033));
  recorder.push(makeFrame(100));
  recorder.push(makeFrame(133));

  const recording = parseFrameRecording(recorder.serialize());
  assert.equal(recording.frames.length, 2);
  assert.equal(recording.frames[0].timestamp, 100);
});

test('frameRecorder: ignores invalid frames and copies ROI data', () => {
  const recorder = createFrameRecorder();
  recorder.push({ timestamp: NaN, rois: [] });
  const source = makeFrame(0);
  recorder.push(source);
  source.rois[0].r = 999;

  const recording = parseFrameRecording(recorder.serialize());
  assert.equal(recording.frames.length, 1);
  assert.equal(recording.frames[0].rois[0].r, 150);
});

test('parseFrameRecording: rejects malformed payloads', () => {
  assert.throws(() => parseFrameRecording('null'));
  assert.throws(() => parseFrameRecording('{"version":2,"frames":[]}'));
  assert.throws(() => parseFrameRecording('{"version":1}'));
  assert.throws(() => parseFrameRecording('{"version":1,"frames":[{"timestamp":"x","rois":[]}]}'));
});
