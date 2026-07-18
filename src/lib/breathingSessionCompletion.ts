import {
  buildBpmSeries,
  type BpmSeriesSummary,
  type BpmTimePoint,
} from './heartRate/bpmSeries';
import type { SessionBpmSample } from './heartRate/sessionBpmSampler';
import {
  getBreathingSessionDurationSeconds,
  getBreathingSessionTargetSeconds,
  type BreathingPhaseDurations,
} from './breathingSessionTiming';

interface BuildBreathingSessionCompletionInput {
  pattern: BreathingPhaseDurations;
  rounds: number;
  startedAtMs: number;
  endedAtMs: number;
  fallbackElapsedSeconds: number;
  bpmSamples: readonly SessionBpmSample[];
}

export interface BreathingSessionCompletion {
  startedAtMs: number;
  endedAtMs: number;
  durationSeconds: number;
  targetSeconds: number;
  bpmSamples: SessionBpmSample[];
  graphSamples: BpmTimePoint[];
  bpmSummary: BpmSeriesSummary;
}

export function buildBreathingSessionCompletion({
  pattern,
  rounds,
  startedAtMs,
  endedAtMs,
  fallbackElapsedSeconds,
  bpmSamples: collectedBpmSamples,
}: BuildBreathingSessionCompletionInput): BreathingSessionCompletion {
  const bpmSamples = collectedBpmSamples.length >= 2
    ? collectedBpmSamples.map((sample) => ({ ...sample }))
    : [];
  const graphSamples = bpmSamples.map(({ offsetMs, bpm }) => ({ offsetMs, bpm }));
  const bpmSummary = buildBpmSeries(graphSamples, { mode: 'exercise' }).summary;

  return {
    startedAtMs: startedAtMs > 0 ? startedAtMs : endedAtMs,
    endedAtMs,
    durationSeconds: getBreathingSessionDurationSeconds(
      startedAtMs,
      endedAtMs,
      fallbackElapsedSeconds,
    ),
    targetSeconds: getBreathingSessionTargetSeconds(pattern, rounds),
    bpmSamples,
    graphSamples,
    bpmSummary,
  };
}
