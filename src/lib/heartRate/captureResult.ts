import type { CaptureResult, PpgFrameSample } from './types';
import { computeBPM } from './signalProcessing';

export function buildCaptureResult(samples: PpgFrameSample[]): CaptureResult {
  const bpmResult = computeBPM(samples);

  if (bpmResult == null) {
    const tooFew = samples.length < 60;
    return {
      reading: null,
      error: tooFew ? 'too_few_samples' : 'low_confidence',
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
    },
    error: null,
  };
}
