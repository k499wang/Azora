import { computeHRVStats } from '../hrv';
import type { CaptureResult, IbiSample, PpgFrameSample } from './types';
import { computeBPM } from './signalProcessing';

const MIN_HRV_SIGNAL_QUALITY = 0.6;

export function getHrvEligibleIbiMs(ibiSamples: IbiSample[]): number[] {
  return ibiSamples
    .filter((sample) =>
      sample.signalQuality != null &&
      Number.isFinite(sample.signalQuality) &&
      sample.signalQuality >= MIN_HRV_SIGNAL_QUALITY,
    )
    .map((sample) => sample.ibiMs);
}

export function buildCaptureResult(
  samples: PpgFrameSample[],
  ibiSamples: IbiSample[] = [],
): CaptureResult {
  const bpmResult = computeBPM(samples);
  const hrvStats = computeHRVStats(getHrvEligibleIbiMs(ibiSamples));

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
      rmssd: hrvStats.rmssd,
      sdnn: hrvStats.sdnn,
      pnn50: hrvStats.pnn50,
      hrDrop: hrvStats.hrDrop,
      beatCount: hrvStats.beatCount,
    },
    error: null,
    ibiSamples,
  };
}
