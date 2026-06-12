import { computeHRVStatsFromCleanIntervals, preprocessHRVIntervals } from '../hrv';
import type { HRVStats } from '../hrv';
import type { CaptureResult, HrvAvailabilityReason, IbiSample, PpgFrameSample } from './types';
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
const MIN_FALLBACK_IBI_SIGNAL_QUALITY = 0.6;
const MIN_FALLBACK_IBI_QUALITY_RATIO = 0.85;

interface CaptureHrvResult {
  hrvStats: HRVStats | null;
  correctedIbi: number[];
  hrvAvailabilityReason: HrvAvailabilityReason | null;
  ibiSamples?: IbiSample[];
}

interface BuildCaptureResultOptions {
  fallbackIbiSamples?: IbiSample[];
}

export function deriveCaptureHrvResult(
  hrvBeatSeries: CaptureBeatSeries | null,
  captureBpm?: number | null,
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

  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] initial', {
    captureBpm,
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
    failedGates: {
      beatSeriesNull: hrvBeatSeries == null,
      tooFewBeats: hrvBeatSeries != null && hrvEligibleIbis.length < MIN_HRV_BEAT_COUNT,
      lowConfidence: hrvBeatSeries != null && hrvBeatSeries.confidence < MIN_HRV_CONFIDENCE,
      lowSnr: hrvBeatSeries != null && hrvBeatSeries.snrDb < MIN_HRV_SNR_DB,
      poorQuality: hrvBeatSeries != null && hrvBeatSeries.quality === 'poor',
      lowRetention: hrvBeatSeries != null && hrvRetentionRatio < MIN_HRV_RETENTION_RATIO,
    },
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
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] postprocess fail: not_enough_clean_beats', {
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
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] postprocess fail: low_signal_quality', {
      correctedLength: hrvPreprocess.correctedIbi.length,
      artifactRatio: hrvPreprocess.artifactRatio,
    });
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'low_signal_quality',
    };
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] passed', {
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function buildCorrectedIbiSamples(
  correctedIbi: number[],
  sourceSamples: IbiSample[],
): IbiSample[] {
  if (correctedIbi.length === 0) return [];

  let lastOffsetMs = sourceSamples[0]?.offsetMs ?? correctedIbi[0];

  return correctedIbi.map((ibiMs, index) => {
    const sourceSample = sourceSamples[index];
    const offsetMs =
      sourceSample?.offsetMs != null
        ? sourceSample.offsetMs
        : lastOffsetMs + (index === 0 ? 0 : ibiMs);
    lastOffsetMs = offsetMs;

    return {
      offsetMs: Math.max(0, Math.round(offsetMs)),
      ibiMs: Math.round(ibiMs),
      signalQuality: sourceSample?.signalQuality ?? null,
    };
  });
}

export function deriveIbiSampleHrvResult(
  ibiSamples: IbiSample[],
): CaptureHrvResult {
  const validSamples = [...ibiSamples]
    .filter((sample) => (
      isFiniteNumber(sample.offsetMs) &&
      sample.offsetMs >= 0 &&
      isFiniteNumber(sample.ibiMs) &&
      sample.ibiMs > 0
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs);

  const qualityEligibleSamples = validSamples.filter((sample) => (
    isFiniteNumber(sample.signalQuality) &&
    sample.signalQuality >= MIN_FALLBACK_IBI_SIGNAL_QUALITY
  ));
  const qualityRatio =
    validSamples.length > 0 ? qualityEligibleSamples.length / validSamples.length : 0;
  const hrvEligibleIbis = qualityEligibleSamples.map((sample) => sample.ibiMs);

  const initialAvailabilityReason: HrvAvailabilityReason | null =
    validSamples.length < MIN_HRV_BEAT_COUNT
      ? 'not_enough_clean_beats'
      : qualityRatio < MIN_FALLBACK_IBI_QUALITY_RATIO
        ? 'low_signal_quality'
        : hrvEligibleIbis.length < MIN_HRV_BEAT_COUNT
          ? 'not_enough_clean_beats'
          : null;

  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] fallback initial', {
    beats: hrvEligibleIbis.length,
    minBeats: MIN_HRV_BEAT_COUNT,
    validSamples: validSamples.length,
    qualityEligibleSamples: qualityEligibleSamples.length,
    qualityRatio,
    minQualityRatio: MIN_FALLBACK_IBI_QUALITY_RATIO,
    minSignalQuality: MIN_FALLBACK_IBI_SIGNAL_QUALITY,
    reason: initialAvailabilityReason,
  });

  if (initialAvailabilityReason != null) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: initialAvailabilityReason,
      ibiSamples: [],
    };
  }

  const hrvPreprocess = preprocessHRVIntervals(hrvEligibleIbis);

  if (hrvPreprocess.correctedIbi.length < MIN_HRV_BEAT_COUNT) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] fallback postprocess fail: not_enough_clean_beats', {
      correctedLength: hrvPreprocess.correctedIbi.length,
      minBeats: MIN_HRV_BEAT_COUNT,
      artifactRatio: hrvPreprocess.artifactRatio,
    });
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'not_enough_clean_beats',
      ibiSamples: [],
    };
  }

  if (!hrvPreprocess.usable) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] fallback postprocess fail: low_signal_quality', {
      correctedLength: hrvPreprocess.correctedIbi.length,
      artifactRatio: hrvPreprocess.artifactRatio,
    });
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'low_signal_quality',
      ibiSamples: [],
    };
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[hrv-gate] fallback passed', {
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
    ibiSamples: buildCorrectedIbiSamples(
      hrvPreprocess.correctedIbi,
      qualityEligibleSamples,
    ),
  };
}

export function buildCaptureResult(
  samples: PpgFrameSample[],
  mode: HeartRateCaptureMode = DEFAULT_CAPTURE_MODE,
  options: BuildCaptureResultOptions = {},
): CaptureResult {
  const { computeHrv } = getCaptureModeConfig(mode);
  const { estimate: bpmResult, beatSeries: hrvBeatSeries } = analyzeCapture(samples);
  const startTs = samples[0]?.timestamp ?? 0;
  const endTs = samples[samples.length - 1]?.timestamp ?? 0;
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

  const hrv = computeHrv ? deriveCaptureHrvResult(hrvBeatSeries, bpmResult?.bpm) : null;
  const fallbackHrv =
    computeHrv &&
    hrv?.hrvStats == null &&
    options.fallbackIbiSamples != null &&
    options.fallbackIbiSamples.length > 0
      ? deriveIbiSampleHrvResult(options.fallbackIbiSamples)
      : null;
  const resolvedHrv = fallbackHrv?.hrvStats != null ? fallbackHrv : hrv;
  const finalIbiSamples =
    resolvedHrv?.hrvStats != null && hrvBeatSeries != null && fallbackHrv?.hrvStats == null
      ? buildIbiSamplesFromCaptureBeatSeries(hrvBeatSeries, startTs, resolvedHrv.correctedIbi)
      : resolvedHrv?.hrvStats != null
        ? resolvedHrv.ibiSamples ?? []
      : [];

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
      rmssd: resolvedHrv?.hrvStats?.rmssd,
      sdnn: resolvedHrv?.hrvStats?.sdnn,
      stress: resolvedHrv?.hrvStats?.stress,
      pnn50: resolvedHrv?.hrvStats?.pnn50,
      hrDrop: resolvedHrv?.hrvStats?.hrDrop,
      beatCount: resolvedHrv?.hrvStats?.beatCount,
      hrvAvailabilityReason: resolvedHrv?.hrvAvailabilityReason ?? undefined,
    },
    error: null,
    ibiSamples: finalIbiSamples,
    mode,
  };
}
