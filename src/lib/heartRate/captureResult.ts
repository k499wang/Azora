import { computeHRVStatsFromCleanIntervals, preprocessHRVIntervals } from '../hrv';
import type { HRVStats } from '../hrv';
import type { CaptureResult, HrvAvailabilityReason, IbiSample, PpgFrameSample } from './types';
import {
  analyzeCapture,
  buildIbiSamplesFromCaptureBeatSeries,
  type CaptureBeatSeries,
} from './signalProcessing';

const MIN_HRV_BEAT_COUNT = 15;
const MIN_HRV_CONFIDENCE = 0.55;
const MIN_HRV_SNR_DB = 4;
const MIN_HRV_RETENTION_RATIO = 0.7;
const MIN_LIVE_BPM_IBI_COUNT = 5;

interface CaptureHrvResult {
  hrvStats: HRVStats | null;
  correctedIbi: number[];
  hrvAvailabilityReason: HrvAvailabilityReason | null;
}

interface LiveIbiHrvResult extends CaptureHrvResult {
  normalizedIbiSamples: IbiSample[];
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  meanSignalQuality: number | null;
}

interface BuildCaptureResultOptions {
  preferLiveIbiSamples?: boolean;
}

function normalizeIbiSamples(ibiSamples: IbiSample[]): IbiSample[] {
  return ibiSamples
    .filter((sample) => (
      Number.isFinite(sample.offsetMs) &&
      sample.offsetMs >= 0 &&
      Number.isFinite(sample.ibiMs) &&
      sample.ibiMs >= 300 &&
      sample.ibiMs <= 2000
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs)
    .map((sample) => ({
      offsetMs: Math.round(sample.offsetMs),
      ibiMs: Math.round(sample.ibiMs),
      signalQuality: typeof sample.signalQuality === 'number' && Number.isFinite(sample.signalQuality)
        ? Math.min(1, Math.max(0, sample.signalQuality))
        : null,
    }));
}

function summarizeIbiBpm(ibiSamples: IbiSample[]): {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
} {
  if (ibiSamples.length < MIN_LIVE_BPM_IBI_COUNT) {
    return { avgBpm: null, minBpm: null, maxBpm: null };
  }

  const bpms = ibiSamples
    .map((sample) => Math.round(60000 / sample.ibiMs))
    .filter((bpm) => Number.isFinite(bpm) && bpm >= 20 && bpm <= 240);

  if (bpms.length < MIN_LIVE_BPM_IBI_COUNT) {
    return { avgBpm: null, minBpm: null, maxBpm: null };
  }

  return {
    avgBpm: Math.round(bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length),
    minBpm: Math.min(...bpms),
    maxBpm: Math.max(...bpms),
  };
}

function meanSignalQuality(ibiSamples: IbiSample[]): number | null {
  const values = ibiSamples
    .map((sample) => sample.signalQuality)
    .filter((value): value is number => Number.isFinite(value));

  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildIbiSamplesFromCorrectedLiveIntervals(
  correctedIbi: number[],
  sourceSamples: IbiSample[],
  signalQuality: number | null,
): IbiSample[] {
  if (correctedIbi.length === 0) return [];

  const firstSample = sourceSamples[0];
  let intervalEndOffset =
    firstSample == null
      ? 0
      : Math.max(0, firstSample.offsetMs - firstSample.ibiMs);

  return correctedIbi.map((ibiMs) => {
    intervalEndOffset += ibiMs;

    return {
      offsetMs: Math.max(0, Math.round(intervalEndOffset)),
      ibiMs: Math.round(ibiMs),
      signalQuality,
    };
  });
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

export function deriveLiveIbiHrvResult(
  liveIbiSamples: IbiSample[],
): LiveIbiHrvResult {
  const normalizedIbiSamples = normalizeIbiSamples(liveIbiSamples);
  const bpmSummary = summarizeIbiBpm(normalizedIbiSamples);
  const quality = meanSignalQuality(normalizedIbiSamples);
  const ibiMs = normalizedIbiSamples.map((sample) => sample.ibiMs);

  if (ibiMs.length < MIN_HRV_BEAT_COUNT) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'not_enough_clean_beats',
      normalizedIbiSamples,
      meanSignalQuality: quality,
      ...bpmSummary,
    };
  }

  const hrvPreprocess = preprocessHRVIntervals(ibiMs);

  if (hrvPreprocess.correctedIbi.length < MIN_HRV_BEAT_COUNT) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'not_enough_clean_beats',
      normalizedIbiSamples,
      meanSignalQuality: quality,
      ...bpmSummary,
    };
  }

  if (!hrvPreprocess.usable) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvAvailabilityReason: 'low_signal_quality',
      normalizedIbiSamples,
      meanSignalQuality: quality,
      ...bpmSummary,
    };
  }

  return {
    hrvStats: computeHRVStatsFromCleanIntervals({
      ibi: hrvPreprocess.correctedIbi,
      adjacencyBreaks: hrvPreprocess.adjacencyBreaks,
      artifactRatio: hrvPreprocess.artifactRatio,
      usable: hrvPreprocess.usable,
    }),
    correctedIbi: hrvPreprocess.correctedIbi,
    hrvAvailabilityReason: null,
    normalizedIbiSamples,
    meanSignalQuality: quality,
    ...bpmSummary,
  };
}

export function buildCaptureResult(
  samples: PpgFrameSample[],
  liveIbiSamples: IbiSample[] = [],
  options: BuildCaptureResultOptions = {},
): CaptureResult {
  const { estimate: bpmResult, beatSeries: hrvBeatSeries } = analyzeCapture(samples);
  const captureHrvResult = deriveCaptureHrvResult(hrvBeatSeries);
  const liveHrvResult = deriveLiveIbiHrvResult(liveIbiSamples);
  const useLiveIbiWindow =
    options.preferLiveIbiSamples === true &&
    liveHrvResult.normalizedIbiSamples.length > 0;
  const hrvStats = useLiveIbiWindow
    ? liveHrvResult.hrvStats
    : captureHrvResult.hrvStats;
  const correctedIbi = useLiveIbiWindow
    ? liveHrvResult.correctedIbi
    : captureHrvResult.correctedIbi;
  const hrvAvailabilityReason = useLiveIbiWindow
    ? liveHrvResult.hrvAvailabilityReason
    : captureHrvResult.hrvAvailabilityReason;
  const startTs = samples[0]?.timestamp ?? 0;
  const endTs = samples[samples.length - 1]?.timestamp ?? 0;
  const finalIbiSamples =
    hrvStats == null
      ? []
      : useLiveIbiWindow
        ? buildIbiSamplesFromCorrectedLiveIntervals(
            correctedIbi,
            liveHrvResult.normalizedIbiSamples,
            liveHrvResult.meanSignalQuality,
          )
        : hrvBeatSeries != null
          ? buildIbiSamplesFromCaptureBeatSeries(hrvBeatSeries, startTs, correctedIbi)
          : [];
  const windowDurationMs = endTs > startTs ? endTs - startTs : 0;
  const liveBpm = useLiveIbiWindow
    ? hrvStats?.meanHr ?? liveHrvResult.avgBpm
    : null;
  const readingBpm = liveBpm ?? bpmResult?.bpm ?? null;

  if (readingBpm == null) {
    const tooFew = samples.length < 60;
    return {
      reading: null,
      error: tooFew ? 'too_few_samples' : 'low_confidence',
      ibiSamples: [],
    };
  }

  return {
    reading: {
      bpm: readingBpm,
      confidence: bpmResult?.confidence ?? liveHrvResult.meanSignalQuality ?? 0,
      quality: bpmResult?.quality,
      roiId: bpmResult?.roiId,
      channel: bpmResult?.channel,
      snrDb: bpmResult?.snrDb,
      frequencyBpm: bpmResult?.frequencyBpm,
      peakBpm: bpmResult?.peakBpm ?? null,
      sampleCount: samples.length || bpmResult?.sampleCount || liveHrvResult.normalizedIbiSamples.length,
      durationMs: windowDurationMs || bpmResult?.durationMs || (hrvStats?.durationSec ?? 0) * 1000,
      recordedAt: new Date().toISOString(),
      source: 'camera-flash',
      rmssd: hrvStats?.rmssd,
      sdnn: hrvStats?.sdnn,
      stress: hrvStats?.stress,
      pnn50: hrvStats?.pnn50,
      hrDrop: hrvStats?.hrDrop,
      beatCount: hrvStats?.beatCount,
      hrvAvailabilityReason: hrvAvailabilityReason ?? undefined,
    },
    error: null,
    ibiSamples: finalIbiSamples,
  };
}
