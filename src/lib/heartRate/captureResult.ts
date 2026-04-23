import { computeHRVStats } from '../hrv';
import type { CaptureResult, IbiSample, PpgFrameSample } from './types';
import { computeBPM, extractBestCaptureBeatSeries } from './signalProcessing';

const MIN_HRV_BEAT_COUNT = 15;
const MIN_HRV_CONFIDENCE = 0.55;
const MIN_HRV_SNR_DB = 4;
const MIN_HRV_RETENTION_RATIO = 0.7;

export function buildCaptureResult(
  samples: PpgFrameSample[],
  ibiSamples: IbiSample[] = [],
): CaptureResult {
  const bpmResult = computeBPM(samples);
  const hrvBeatSeries = extractBestCaptureBeatSeries(samples);
  const hrvEligibleIbis = hrvBeatSeries?.ibiMs ?? [];
  const hrvRetentionRatio =
    hrvBeatSeries != null && hrvBeatSeries.rawIntervalCount > 0
      ? (hrvBeatSeries.rawIntervalCount - hrvBeatSeries.rejectedIntervalCount) / hrvBeatSeries.rawIntervalCount
      : 0;
  const hrvAvailabilityReason =
    hrvBeatSeries == null
      ? 'low_signal_quality'
      : hrvEligibleIbis.length < MIN_HRV_BEAT_COUNT
        ? 'not_enough_clean_beats'
        : (
          hrvBeatSeries.confidence < MIN_HRV_CONFIDENCE ||
          hrvBeatSeries.snrDb < MIN_HRV_SNR_DB ||
          hrvBeatSeries.quality === 'poor' ||
          hrvRetentionRatio < MIN_HRV_RETENTION_RATIO
        )
          ? 'low_signal_quality'
          : null;
  const hrvStats = hrvAvailabilityReason == null ? computeHRVStats(hrvEligibleIbis) : null;

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
      beatCount: hrvStats?.beatCount,
      hrvAvailabilityReason: hrvAvailabilityReason ?? undefined,
    },
    error: null,
    ibiSamples,
  };
}
