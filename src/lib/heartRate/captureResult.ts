import { computeHRVStatsFromCleanIntervals, preprocessHRVIntervals } from '../hrv';
import type { HRVStats } from '../hrv';
import type { CaptureResult, HrvAvailabilityReason, PpgFrameSample } from './types';
import {
  analyzeCapture,
  buildIbiSamplesFromCaptureBeatSeries,
  type CaptureBeatSeries,
} from './signalProcessing';
import {
  DEFAULT_CAPTURE_MODE,
  getCaptureModeConfig,
  type HeartRateCaptureMode,
} from './captureModes';

const MIN_HRV_BEAT_COUNT = 15;
const MIN_HRV_CONFIDENCE = 0.55;
const MIN_HRV_SNR_DB = 4;
const MIN_HRV_RETENTION_RATIO = 0.7;

interface CaptureHrvResult {
  hrvStats: HRVStats | null;
  correctedIbi: number[];
  hrvAvailabilityReason: HrvAvailabilityReason | null;
}

export function deriveCaptureHrvResult(
  hrvBeatSeries: CaptureBeatSeries | null,
): CaptureHrvResult {
  const hrvEligibleIbis = hrvBeatSeries?.ibiMs ?? [];
  const hrvRetentionRatio =
    hrvBeatSeries != null && hrvBeatSeries.rawIntervalCount > 0
      ? (hrvBeatSeries.rawIntervalCount - hrvBeatSeries.rejectedIntervalCount) / hrvBeatSeries.rawIntervalCount
      : 0;

  const initialAvailabilityReason: HrvAvailabilityReason | null =
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

  console.log('[hrv-gate] initial', {
    beats: hrvEligibleIbis.length,
    minBeats: MIN_HRV_BEAT_COUNT,
    confidence: hrvBeatSeries?.confidence,
    minConfidence: MIN_HRV_CONFIDENCE,
    snrDb: hrvBeatSeries?.snrDb,
    minSnrDb: MIN_HRV_SNR_DB,
    quality: hrvBeatSeries?.quality,
    rawIntervals: hrvBeatSeries?.rawIntervalCount,
    rejectedIntervals: hrvBeatSeries?.rejectedIntervalCount,
    retention: hrvRetentionRatio,
    minRetention: MIN_HRV_RETENTION_RATIO,
    reason: initialAvailabilityReason,
  });

  if (initialAvailabilityReason != null) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: initialAvailabilityReason,
    };
  }

  const hrvPreprocess = preprocessHRVIntervals(
    hrvEligibleIbis,
    hrvBeatSeries?.adjacencyBreaks,
  );

  if (hrvPreprocess.correctedIbi.length < MIN_HRV_BEAT_COUNT) {
    console.log('[hrv-gate] postprocess fail: not_enough_clean_beats', {
      correctedLength: hrvPreprocess.correctedIbi.length,
      minBeats: MIN_HRV_BEAT_COUNT,
      artifactRatio: hrvPreprocess.artifactRatio,
    });
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'not_enough_clean_beats',
    };
  }

  if (!hrvPreprocess.usable) {
    console.log('[hrv-gate] postprocess fail: low_signal_quality', {
      correctedLength: hrvPreprocess.correctedIbi.length,
      artifactRatio: hrvPreprocess.artifactRatio,
    });
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'low_signal_quality',
    };
  }

  console.log('[hrv-gate] passed', {
    correctedLength: hrvPreprocess.correctedIbi.length,
    artifactRatio: hrvPreprocess.artifactRatio,
  });

  return {
    hrvStats: computeHRVStatsFromCleanIntervals({
      ibi: hrvPreprocess.correctedIbi,
      adjacencyBreaks: hrvPreprocess.adjacencyBreaks,
      artifactRatio: hrvPreprocess.artifactRatio,
      usable: hrvPreprocess.usable,
    }),
    correctedIbi: hrvPreprocess.correctedIbi,
    hrvAvailabilityReason: null,
  };
}

export function buildCaptureResult(
  samples: PpgFrameSample[],
  mode: HeartRateCaptureMode = DEFAULT_CAPTURE_MODE,
): CaptureResult {
  const { computeHrv } = getCaptureModeConfig(mode);
  const { estimate: bpmResult, beatSeries: hrvBeatSeries } = analyzeCapture(samples);
  const hrv = computeHrv ? deriveCaptureHrvResult(hrvBeatSeries) : null;
  const startTs = samples[0]?.timestamp ?? 0;
  const endTs = samples[samples.length - 1]?.timestamp ?? 0;
  const finalIbiSamples =
    hrv?.hrvStats != null && hrvBeatSeries != null
      ? buildIbiSamplesFromCaptureBeatSeries(hrvBeatSeries, startTs, hrv.correctedIbi)
      : [];
  const windowDurationMs = endTs > startTs ? endTs - startTs : 0;

  if (bpmResult == null) {
    const tooFew = samples.length < 60;
    return {
      reading: null,
      error: tooFew ? 'too_few_samples' : 'low_confidence',
      ibiSamples: [],
      mode,
    };
  }

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
      durationMs: bpmResult.durationMs || windowDurationMs,
      recordedAt: new Date().toISOString(),
      source: 'camera-flash',
      rmssd: hrv?.hrvStats?.rmssd,
      sdnn: hrv?.hrvStats?.sdnn,
      stress: hrv?.hrvStats?.stress,
      pnn50: hrv?.hrvStats?.pnn50,
      hrDrop: hrv?.hrvStats?.hrDrop,
      beatCount: hrv?.hrvStats?.beatCount,
      hrvAvailabilityReason: hrv?.hrvAvailabilityReason ?? undefined,
    },
    error: null,
    ibiSamples: finalIbiSamples,
    mode,
  };
}
