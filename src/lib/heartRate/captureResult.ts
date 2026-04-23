import { computeHRVStats } from '../hrv';
import type { CaptureResult, IbiSample, PpgFrameSample } from './types';
import { computeBPM, extractBestCaptureBeatSeries } from './signalProcessing';

const MIN_HRV_BEAT_COUNT = 12;

export function buildCaptureResult(
  samples: PpgFrameSample[],
  ibiSamples: IbiSample[] = [],
): CaptureResult {
  const bpmResult = computeBPM(samples);
  const hrvBeatSeries = extractBestCaptureBeatSeries(samples);
  const hrvEligibleIbis = hrvBeatSeries?.ibiMs ?? [];
  const hrvStats =
    hrvEligibleIbis.length >= MIN_HRV_BEAT_COUNT
      ? computeHRVStats(hrvEligibleIbis)
      : null;

  if (bpmResult == null) {
    const tooFew = samples.length < 60;
    return {
      reading: null,
      error: tooFew ? 'too_few_samples' : 'low_confidence',
      ibiSamples,
    };
  }

  const startTs = samples[0]?.timestamp ?? 0;
  const endTs = samples[samples.length - 1]?.timestamp ?? 0;

  return {
    reading: {
      bpm: bpmResult.bpm,
      confidence: bpmResult.confidence,
      quality: bpmResult.quality,
      roiId: bpmResult.roiId,
      channel: bpmResult.channel,
      snrDb: bpmResult.snrDb,
      frequencyBpm: bpmResult.frequencyBpm,
      peakBpm: bpmResult.peakBpm,
      sampleCount: bpmResult.sampleCount,
      durationMs: bpmResult.durationMs || endTs - startTs,
      recordedAt: new Date().toISOString(),
      source: 'camera-flash',
      rmssd: hrvStats?.rmssd,
      sdnn: hrvStats?.sdnn,
      pnn50: hrvStats?.pnn50,
      hrDrop: hrvStats?.hrDrop,
      beatCount: hrvStats?.beatCount ?? hrvBeatSeries?.ibiMs.length,
    },
    error: null,
    ibiSamples,
  };
}
