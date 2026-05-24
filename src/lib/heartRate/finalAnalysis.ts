import {
  computeHRVStatsFromCleanIntervals,
  preprocessHRVIntervals,
  type HRVStats,
} from '../hrv';
import {
  buildPresentationBpmSeriesFromIbis,
  buildRrSeriesFromIbis,
  type PresentationBpmPolicy,
} from './bpmSmoothing';
import {
  analyzeCapture,
  buildIbiSamplesFromCaptureBeatSeries,
  type CaptureBeatSeries,
} from './signalProcessing';
import type {
  BpmSample,
  CaptureResult,
  HeartRateDiagnostics,
  HeartRateReading,
  HrvAvailabilityReason,
  HrvConfidence,
  IbiSample,
  PpgFrameSample,
} from './types';

const MIN_HRV_BEAT_COUNT = 15;
const GOOD_HRV_CONFIDENCE = 0.72;
const FAIR_HRV_CONFIDENCE = 0.55;
const GOOD_HRV_SNR_DB = 6;
const FAIR_HRV_SNR_DB = 4;
const GOOD_HRV_RETENTION_RATIO = 0.85;
const FAIR_HRV_RETENTION_RATIO = 0.7;
const LOW_MAX_ARTIFACT_RATIO = 0.12;

export interface FinalPpgAnalysis {
  reading: HeartRateReading | null;
  cleanIbiSamples: IbiSample[];
  presentationBpmSeries: BpmSample[];
  rrSeries: IbiSample[];
  diagnostics: HeartRateDiagnostics;
  error: CaptureResult['error'];
}

interface CaptureHrvResult {
  hrvStats: HRVStats | null;
  correctedIbi: number[];
  hrvConfidence: HrvConfidence;
  hrvAvailabilityReason: HrvAvailabilityReason | null;
  artifactRatio: number | null;
}

function retentionRatio(beatSeries: CaptureBeatSeries | null): number | null {
  if (beatSeries == null || beatSeries.rawIntervalCount <= 0) return null;
  return (
    (beatSeries.rawIntervalCount - beatSeries.rejectedIntervalCount) /
    beatSeries.rawIntervalCount
  );
}

function classifyHrvConfidence(
  beatSeries: CaptureBeatSeries,
  stats: HRVStats,
  retainedRatio: number,
): HrvConfidence {
  if (
    beatSeries.confidence >= GOOD_HRV_CONFIDENCE &&
    beatSeries.snrDb >= GOOD_HRV_SNR_DB &&
    beatSeries.quality === 'good' &&
    retainedRatio >= GOOD_HRV_RETENTION_RATIO &&
    stats.artifactRatio <= 0.03
  ) {
    return 'good';
  }

  if (
    beatSeries.confidence >= FAIR_HRV_CONFIDENCE &&
    beatSeries.snrDb >= FAIR_HRV_SNR_DB &&
    beatSeries.quality !== 'poor' &&
    retainedRatio >= FAIR_HRV_RETENTION_RATIO &&
    stats.artifactRatio <= 0.05
  ) {
    return 'fair';
  }

  return 'low';
}

function buildDiagnostics(
  beatSeries: CaptureBeatSeries | null,
  stats: HRVStats | null,
  artifactRatio: number | null,
): HeartRateDiagnostics {
  const retainedRatio = retentionRatio(beatSeries);
  return {
    roiId: beatSeries?.roiId ?? null,
    channel: beatSeries?.channel ?? null,
    snrDb: beatSeries?.snrDb ?? null,
    frequencyBpm: beatSeries?.frequencyBpm ?? null,
    peakBpm: beatSeries?.peakBpm ?? null,
    rawIntervalCount: beatSeries?.rawIntervalCount ?? 0,
    rejectedIntervalCount: beatSeries?.rejectedIntervalCount ?? 0,
    retentionRatio: retainedRatio,
    artifactRatio,
    rawSdnn: stats?.sdnn ?? null,
  };
}

export function deriveCaptureHrvResult(
  beatSeries: CaptureBeatSeries | null,
): CaptureHrvResult {
  const retainedRatio = retentionRatio(beatSeries) ?? 0;

  if (beatSeries == null) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvConfidence: 'unavailable',
      hrvAvailabilityReason: 'low_signal_quality',
      artifactRatio: null,
    };
  }

  if (beatSeries.ibiMs.length < MIN_HRV_BEAT_COUNT) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvConfidence: 'unavailable',
      hrvAvailabilityReason: 'not_enough_clean_beats',
      artifactRatio: null,
    };
  }

  const hrvPreprocess = preprocessHRVIntervals(
    beatSeries.ibiMs,
    beatSeries.adjacencyBreaks,
  );

  if (hrvPreprocess.correctedIbi.length < MIN_HRV_BEAT_COUNT) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvConfidence: 'unavailable',
      hrvAvailabilityReason: 'not_enough_clean_beats',
      artifactRatio: hrvPreprocess.artifactRatio,
    };
  }

  const lowConfidenceUsable =
    hrvPreprocess.maxRunLength <= 2 &&
    hrvPreprocess.artifactRatio <= LOW_MAX_ARTIFACT_RATIO;

  if (!hrvPreprocess.usable && !lowConfidenceUsable) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvConfidence: 'unavailable',
      hrvAvailabilityReason: 'low_signal_quality',
      artifactRatio: hrvPreprocess.artifactRatio,
    };
  }

  const usable = hrvPreprocess.usable || lowConfidenceUsable;
  const hrvStats = computeHRVStatsFromCleanIntervals({
    ibi: hrvPreprocess.correctedIbi,
    adjacencyBreaks: hrvPreprocess.adjacencyBreaks,
    artifactRatio: hrvPreprocess.artifactRatio,
    usable,
  });

  if (!hrvStats.usable) {
    return {
      hrvStats: null,
      correctedIbi: [],
      hrvConfidence: 'unavailable',
      hrvAvailabilityReason: 'low_signal_quality',
      artifactRatio: hrvPreprocess.artifactRatio,
    };
  }

  return {
    hrvStats,
    correctedIbi: hrvPreprocess.correctedIbi,
    hrvConfidence: classifyHrvConfidence(beatSeries, hrvStats, retainedRatio),
    hrvAvailabilityReason: null,
    artifactRatio: hrvPreprocess.artifactRatio,
  };
}

export function analyzeFinalPpgCapture(
  samples: PpgFrameSample[],
  options: { presentationPolicy?: PresentationBpmPolicy } = {},
): FinalPpgAnalysis {
  const { estimate, beatSeries } = analyzeCapture(samples);
  const hrv = deriveCaptureHrvResult(beatSeries);
  const startTs = samples[0]?.timestamp ?? 0;
  const endTs = samples[samples.length - 1]?.timestamp ?? 0;
  const windowDurationMs = endTs > startTs ? endTs - startTs : 0;

  const cleanIbiSamples =
    hrv.hrvStats != null && beatSeries != null
      ? buildIbiSamplesFromCaptureBeatSeries(beatSeries, startTs, hrv.correctedIbi)
      : [];
  const presentationBpmSeries = buildPresentationBpmSeriesFromIbis(
    cleanIbiSamples,
    options.presentationPolicy ?? 'restingResult',
  );
  const rrSeries = buildRrSeriesFromIbis(cleanIbiSamples);
  const diagnostics = buildDiagnostics(beatSeries, hrv.hrvStats, hrv.artifactRatio);

  if (estimate == null) {
    const tooFew = samples.length < 60;
    return {
      reading: null,
      error: tooFew ? 'too_few_samples' : 'low_confidence',
      cleanIbiSamples: [],
      presentationBpmSeries: [],
      rrSeries: [],
      diagnostics,
    };
  }

  const reading: HeartRateReading = {
    bpm: estimate.bpm,
    confidence: estimate.confidence,
    quality: estimate.quality,
    roiId: estimate.roiId,
    channel: estimate.channel,
    snrDb: estimate.snrDb,
    frequencyBpm: estimate.frequencyBpm,
    peakBpm: estimate.peakBpm,
    sampleCount: estimate.sampleCount,
    durationMs: estimate.durationMs || windowDurationMs,
    recordedAt: new Date().toISOString(),
    source: 'camera-flash',
    rmssd: hrv.hrvStats?.rmssd,
    sdnn: hrv.hrvStats?.detrendedSdnn,
    detrendedSdnn: hrv.hrvStats?.detrendedSdnn,
    stress: hrv.hrvStats?.stress,
    pnn50: hrv.hrvStats?.pnn50,
    hrDrop: hrv.hrvStats?.hrDrop,
    beatCount: hrv.hrvStats?.beatCount,
    hrvConfidence: hrv.hrvConfidence,
    hrvAvailabilityReason: hrv.hrvAvailabilityReason ?? undefined,
  };

  return {
    reading,
    error: null,
    cleanIbiSamples,
    presentationBpmSeries,
    rrSeries,
    diagnostics,
  };
}

export function finalAnalysisToCaptureResult(analysis: FinalPpgAnalysis): CaptureResult {
  return {
    reading: analysis.reading,
    error: analysis.error,
    ibiSamples: analysis.cleanIbiSamples,
    presentationBpmSeries: analysis.presentationBpmSeries,
    rrSeries: analysis.rrSeries,
    diagnostics: analysis.diagnostics,
  };
}
