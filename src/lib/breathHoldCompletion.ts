import { estimateAzoraScore } from './azoraScore';
import { buildBpmSeries } from './heartRate/bpmSeries';
import type { HeartRateSessionRpcSample } from './heartRate/sessionPayload';

interface BuildBreathHoldCompletionInput {
  holdSeconds: number;
  previousBestSeconds: number;
  measuredStartedAtMs: number;
  holdStartedAtMs: number;
  endedAtMs: number;
  hasReading: boolean;
  captureSampleCount: number;
  bpmSamples: HeartRateSessionRpcSample[];
}

export interface BreathHoldCompletion {
  holdSeconds: number;
  startedAtMs: number | null;
  endedAtMs: number;
  hasReading: boolean;
  sessionKey: string | null;
  isNewBest: boolean;
  bestHoldSeconds: number;
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  azoraScore: number;
  graphSamples: { offsetMs: number; bpm: number }[];
  persistenceSamples: {
    offsetMs: number;
    bpm: number;
    signalQuality: number | null;
  }[];
}

export function buildBreathHoldCompletion({
  holdSeconds,
  previousBestSeconds,
  measuredStartedAtMs,
  holdStartedAtMs,
  endedAtMs,
  hasReading,
  captureSampleCount,
  bpmSamples,
}: BuildBreathHoldCompletionInput): BreathHoldCompletion {
  const candidateStartedAtMs =
    measuredStartedAtMs > 0
      ? Math.min(measuredStartedAtMs, holdStartedAtMs || measuredStartedAtMs)
      : holdStartedAtMs;
  const startedAtMs =
    candidateStartedAtMs > 0 && endedAtMs >= candidateStartedAtMs
      ? candidateStartedAtMs
      : null;
  const graphSamples = bpmSamples.map((sample) => ({
    offsetMs: sample.offset_ms,
    bpm: sample.bpm,
  }));
  const { summary } = buildBpmSeries(graphSamples, { mode: 'exercise' });
  const isNewBest = holdSeconds > previousBestSeconds && holdSeconds > 0;
  const bestHoldSeconds = Math.max(previousBestSeconds, holdSeconds);
  const azoraScore = estimateAzoraScore({
    holdSeconds,
    avgBpm: summary.avgBpm ?? undefined,
    minBpm: summary.minBpm ?? undefined,
  }).score;

  return {
    holdSeconds,
    startedAtMs,
    endedAtMs,
    hasReading,
    sessionKey:
      startedAtMs == null
        ? null
        : [
            startedAtMs,
            endedAtMs,
            holdSeconds,
            captureSampleCount,
            bpmSamples.length,
          ].join(':'),
    isNewBest,
    bestHoldSeconds,
    avgBpm: summary.avgBpm,
    minBpm: summary.minBpm,
    maxBpm: summary.maxBpm,
    azoraScore,
    graphSamples,
    persistenceSamples: bpmSamples.map((sample) => ({
      offsetMs: sample.offset_ms,
      bpm: sample.bpm,
      signalQuality: sample.signal_quality,
    })),
  };
}
