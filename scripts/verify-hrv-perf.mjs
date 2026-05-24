import {
  analyzeCapture,
  buildIbiSamplesFromCaptureBeatSeries,
} from '../src/lib/heartRate/signalProcessing.ts';
import {
  computeHRVStatsFromCleanIntervals,
  preprocessHRVIntervals,
} from '../src/lib/hrv.ts';

const FRAME_SPACING_MS = 1000 / 30;
const CAPTURE_DURATION_MS = 45000;

function buildCaptureSamples(roiCount = 4) {
  const samples = [];
  let phase = 0;
  for (let timestamp = 0; timestamp <= CAPTURE_DURATION_MS; timestamp += FRAME_SPACING_MS) {
    const bpm = 75 + 4.5 * Math.sin(timestamp / 4200) + 2.5 * Math.sin(timestamp / 1650);
    phase += 2 * Math.PI * (bpm / 60) * (FRAME_SPACING_MS / 1000);
    const pulse =
      Math.sin(phase) +
      0.38 * Math.sin(phase * 2 - 0.7) +
      0.18 * Math.sin(phase * 3 - 1.1);
    const redNoise = 10 * Math.sin(timestamp / 110) + 5.5 * Math.sin(timestamp / 47);
    const slowDrift = 3 * Math.sin(timestamp / 1200);
    const tailArtifact =
      timestamp >= CAPTURE_DURATION_MS - 900
        ? 12 * Math.sin(timestamp / 18) + 6 * Math.sin(timestamp / 9)
        : 0;
    const rois = [
      { id: 'center', r: 72 + redNoise, g: 112 + slowDrift + pulse * 36 + tailArtifact, b: 18 + slowDrift * 0.25, saturatedPct: 0.03, darkPct: 0.01, variance: 120 + Math.abs(pulse) * 25 },
      { id: 'full', r: 20, g: 12, b: 8, saturatedPct: 0.08, darkPct: 0.78, variance: 12 },
    ];
    for (let r = 2; r < roiCount; r++) {
      rois.push({
        id: `quad_${r}`,
        r: 60 + redNoise * 0.6 + r * 3,
        g: 100 + slowDrift * 0.5 + pulse * 28 + tailArtifact * 0.4,
        b: 16 + slowDrift * 0.2,
        saturatedPct: 0.05 + r * 0.01,
        darkPct: 0.05 + r * 0.01,
        variance: 100 + Math.abs(pulse) * 18,
      });
    }
    samples.push({ timestamp, rois });
  }
  return samples;
}

function runOnce(samples) {
  const { estimate, beatSeries } = analyzeCapture(samples);
  let stats = null;
  let ibiSamples = [];
  if (beatSeries) {
    const pre = preprocessHRVIntervals(beatSeries.ibiMs, beatSeries.adjacencyBreaks);
    if (pre.correctedIbi.length >= 15 && pre.usable) {
      stats = computeHRVStatsFromCleanIntervals({
        ibi: pre.correctedIbi,
        adjacencyBreaks: pre.adjacencyBreaks,
        artifactRatio: pre.artifactRatio,
        usable: pre.usable,
      });
      ibiSamples = buildIbiSamplesFromCaptureBeatSeries(beatSeries, samples[0]?.timestamp ?? 0, pre.correctedIbi);
    }
  }
  return { estimate, beatSeries, stats, ibiSamples };
}

function serialize(r) {
  return JSON.stringify({
    estimate: r.estimate && { bpm: r.estimate.bpm, confidence: r.estimate.confidence.toFixed(8), quality: r.estimate.quality, roiId: r.estimate.roiId, channel: r.estimate.channel, snrDb: r.estimate.snrDb.toFixed(8), frequencyBpm: r.estimate.frequencyBpm, peakBpm: r.estimate.peakBpm, sampleCount: r.estimate.sampleCount, durationMs: r.estimate.durationMs },
    beatSeries: r.beatSeries && { roiId: r.beatSeries.roiId, channel: r.beatSeries.channel, confidence: r.beatSeries.confidence.toFixed(8), snrDb: r.beatSeries.snrDb.toFixed(8), frequencyBpm: r.beatSeries.frequencyBpm, peakBpm: r.beatSeries.peakBpm, beatCount: r.beatSeries.beatTimestamps.length, ibiCount: r.beatSeries.ibiMs.length, ibiHead: r.beatSeries.ibiMs.slice(0, 5).map((v) => v.toFixed(4)), ibiTail: r.beatSeries.ibiMs.slice(-5).map((v) => v.toFixed(4)) },
    stats: r.stats,
    ibiCount: r.ibiSamples.length,
  }, null, 2);
}

const roiCounts = [2, 4, 6, 9];
const label = process.argv[2] ?? 'run';
console.log(`=== ${label} ===`);
for (const roiCount of roiCounts) {
  const samples = buildCaptureSamples(roiCount);
  runOnce(samples);
  const runs = 5;
  let totalMs = 0;
  let last;
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    last = runOnce(samples);
    totalMs += performance.now() - t0;
  }
  console.log(`ROI=${roiCount} | avg ${(totalMs / runs).toFixed(2)}ms`);
  console.log(serialize(last));
}
