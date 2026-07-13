// Replays a heart-rate frame recording (exported from the dev menu via
// "Share heart-rate recording") through the real live pipeline and the
// one-shot capture estimator, so live-BPM behavior can be debugged against
// real sessions instead of synthetic waveforms.
//
// Usage: npm run replay:hr -- <recording.json>

import { readFileSync } from 'node:fs';
import { HeartRateManager } from '../src/lib/heartRate/heartRateManager.ts';
import { parseFrameRecording } from '../src/lib/heartRate/frameRecording.ts';
import {
  analyzeCapture,
  HRV_CAPTURE_OPTIONS,
} from '../src/lib/heartRate/signalProcessing.ts';

const path = process.argv[2];
if (path == null) {
  console.error('Usage: npm run replay:hr -- <recording.json>');
  process.exit(1);
}

const recording = parseFrameRecording(readFileSync(path, 'utf8'));
const { frames } = recording;
if (frames.length === 0) {
  console.error('Recording contains no frames.');
  process.exit(1);
}

console.log(`Recording: ${path}`);
console.log(`Recorded at: ${recording.recordedAt || 'unknown'}`);
const startTs = frames[0].timestamp;
const endTs = frames[frames.length - 1].timestamp;
console.log(`Frames: ${frames.length} spanning ${((endTs - startTs) / 1000).toFixed(1)}s`);

const manager = new HeartRateManager({ liveBpmProfile: 'stable' });
const perSecond = new Map();
const tickTimestamps = [];

for (const frame of frames) {
  const state = manager.processFrame(frame);
  if (state.beatDetected && state.beatPeakTs != null) {
    tickTimestamps.push(state.beatPeakTs);
  }
  const sec = Math.floor((frame.timestamp - startTs) / 1000);
  const entry = perSecond.get(sec) ?? {
    sec,
    placements: new Set(),
    statuses: new Set(),
    ticks: 0,
    bpm: null,
  };
  entry.placements.add(state.fingerPlacement);
  entry.statuses.add(state.signalStatus);
  if (state.beatDetected) entry.ticks += 1;
  entry.bpm = manager.getCurrentBpm();
  perSecond.set(sec, entry);
}

console.log('\nsec  bpm   ticks  placement / status');
for (const entry of [...perSecond.values()].sort((a, b) => a.sec - b.sec)) {
  const bpm = entry.bpm == null ? '  --' : String(entry.bpm).padStart(4);
  console.log(
    `${String(entry.sec).padStart(3)}  ${bpm}  ${String(entry.ticks).padStart(5)}  ` +
      `${[...entry.placements].join(',')} / ${[...entry.statuses].join(',')}`,
  );
}

const tickIntervals = tickTimestamps
  .slice(1)
  .map((ts, i) => ts - tickTimestamps[i]);
const shortIntervals = tickIntervals.filter((iv) => iv < 500);
const ibis = manager.getIbiSamples();

console.log('\nLive pipeline summary');
console.log(`  Ticks emitted: ${tickTimestamps.length}`);
console.log(`  Tick intervals < 500ms (suspected doubles): ${shortIntervals.length}`);
console.log(`  Accepted IBIs: ${ibis.length}`);
if (ibis.length > 0) {
  const mean = ibis.reduce((sum, s) => sum + s.ibiMs, 0) / ibis.length;
  console.log(`  Mean IBI: ${mean.toFixed(0)}ms (${(60000 / mean).toFixed(0)} BPM)`);
}
console.log(`  Final live BPM: ${manager.getCurrentBpm() ?? 'none'}`);

const capture = analyzeCapture(frames, HRV_CAPTURE_OPTIONS);
console.log('\nOne-shot capture estimator (ground-truth reference)');
if (capture.estimate == null) {
  console.log('  No estimate (insufficient/unstable signal)');
} else {
  const { bpm, confidence, snrDb, quality, roiId, channel } = capture.estimate;
  console.log(`  BPM: ${bpm} (confidence ${confidence.toFixed(2)}, SNR ${snrDb.toFixed(1)}dB, ${quality})`);
  console.log(`  Best candidate: roi=${roiId} channel=${channel}`);
}
if (capture.beatSeries != null) {
  console.log(`  Beat series: ${capture.beatSeries.ibiMs.length} IBIs, peakBpm ${capture.beatSeries.peakBpm}`);
}
