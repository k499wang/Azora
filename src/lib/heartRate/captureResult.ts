import { computeHRVStatsFromCleanIntervals, preprocessHRVIntervals } from '../hrv';
import type { HRVStats } from '../hrv';
import type {
  CaptureResult,
  HeartRateReading,
  HrvAvailabilityReason,
  IbiSample,
  PpgFrameSample,
  PpgQuality,
  PpgRoiSample,
} from './types';
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
// A finger on the lens under torch is strongly red-dominant and bright. Without
// one, the frequency estimator will still latch onto low-frequency noise near
// the bottom of the band (~40-45 bpm), so the capture must be gated on actual
// finger coverage before any reading is trusted.
const MIN_FINGER_COVERAGE_RATIO = 0.5;

function isRoiFingerCovered(roi: PpgRoiSample): boolean {
  if (!Number.isFinite(roi.r) || !Number.isFinite(roi.g) || !Number.isFinite(roi.b)) {
    return false;
  }
  const value = roi.r * 0.67 + roi.g * 0.33;
  const total = roi.r + roi.g + roi.b;
  const redToSum = total > 0 ? roi.r / total : 0;
  const redToMax = roi.r / Math.max(1, roi.g, roi.b);
  return (
    value >= 25 &&
    value <= 245 &&
    roi.r >= 120 &&
    roi.darkPct < 0.35 &&
    roi.saturatedPct < 0.98 &&
    redToSum >= 0.66 &&
    redToMax >= 1.8
  );
}

function fingerCoverageRatio(samples: PpgFrameSample[]): number {
  let covered = 0;
  let total = 0;
  for (const frame of samples) {
    for (const roi of frame.rois) {
      total += 1;
      if (isRoiFingerCovered(roi)) covered += 1;
    }
  }
  return total > 0 ? covered / total : 0;
}

interface CaptureHrvResult {
  hrvStats: HRVStats | null;
  correctedIbi: number[];
  hrvAvailabilityReason: HrvAvailabilityReason | null;
  ibiSamples?: IbiSample[];
}

interface BuildCaptureResultOptions {
  fallbackIbiSamples?: IbiSample[];
  presentationBpmSamples?: Array<{
    offsetMs: number;
    bpm: number;
  }>;
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

function normalizePresentationBpmSamples(
  samples: BuildCaptureResultOptions['presentationBpmSamples'],
): NonNullable<CaptureResult['bpmSamples']> {
  if (samples == null) return [];

  return samples
    .filter((sample) => (
      isFiniteNumber(sample.offsetMs) &&
      sample.offsetMs >= 0 &&
      isFiniteNumber(sample.bpm) &&
      sample.bpm >= 20 &&
      sample.bpm <= 240
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs)
    .map((sample) => ({
      offsetMs: Math.round(sample.offsetMs),
      bpm: Math.round(sample.bpm),
    }));
}

const MIN_QUICK_LIVE_SAMPLES = 3;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Quick mode's final BPM is the median of what the live detector actually
// reported during the capture, rather than a fresh offline re-analysis, so the
// saved number matches what the user watched.
function buildQuickLiveReading(
  presentationBpmSamples: BuildCaptureResultOptions['presentationBpmSamples'],
  sampleCount: number,
  durationMs: number,
): HeartRateReading | null {
  const bpms = (presentationBpmSamples ?? [])
    .map((sample) => sample.bpm)
    .filter((bpm) => isFiniteNumber(bpm) && bpm >= 20 && bpm <= 240);
  if (bpms.length < MIN_QUICK_LIVE_SAMPLES) return null;

  const bpm = Math.round(median(bpms));
  const spread = Math.max(...bpms) - Math.min(...bpms);
  const confidence =
    bpms.length >= 6 && spread <= 10
      ? 0.85
      : bpms.length >= 4 && spread <= 16
        ? 0.72
        : 0.6;
  const quality: PpgQuality = confidence >= 0.75 ? 'good' : confidence >= 0.6 ? 'fair' : 'poor';

  return {
    bpm,
    confidence,
    quality,
    sampleCount,
    durationMs,
    recordedAt: new Date().toISOString(),
    source: 'camera-flash',
  };
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

  // No finger for (most of) the capture: reject before trusting a frequency
  // estimate, which would otherwise report ~40-45 bpm from low-frequency noise.
  if (fingerCoverageRatio(samples) < MIN_FINGER_COVERAGE_RATIO) {
    return {
      reading: null,
      error: samples.length < 60 ? 'too_few_samples' : 'no_finger',
      ibiSamples: [],
      bpmSamples: normalizePresentationBpmSamples(options.presentationBpmSamples),
      mode,
    };
  }

  const startTs = samples[0]?.timestamp ?? 0;
  const endTs = samples[samples.length - 1]?.timestamp ?? 0;
  const windowDurationMs = endTs > startTs ? endTs - startTs : 0;

  // Quick mode reports the live-analysis BPM as the final reading. If the live
  // path never locked on, do not invent a final number from offline noise.
  if (mode === 'quick') {
    const liveReading = buildQuickLiveReading(
      options.presentationBpmSamples,
      samples.length,
      windowDurationMs,
    );
    if (liveReading != null) {
      return {
        reading: liveReading,
        error: null,
        ibiSamples: [],
        bpmSamples: normalizePresentationBpmSamples(options.presentationBpmSamples),
        mode,
      };
    }

    return {
      reading: null,
      error: 'not_enough_signal',
      ibiSamples: [],
      bpmSamples: normalizePresentationBpmSamples(options.presentationBpmSamples),
      mode,
    };
  }

  const { estimate: bpmResult, beatSeries: hrvBeatSeries } = analyzeCapture(samples);

  if (bpmResult == null) {
    const tooFew = samples.length < 60;
    return {
      reading: null,
      error: tooFew ? 'too_few_samples' : 'low_confidence',
      ibiSamples: [],
      bpmSamples: normalizePresentationBpmSamples(options.presentationBpmSamples),
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
    bpmSamples: normalizePresentationBpmSamples(options.presentationBpmSamples),
    mode,
  };
}
