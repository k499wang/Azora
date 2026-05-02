import type { CaptureResult, IbiSample, PpgFrameSample } from './types';

const MAX_SAMPLE_JUMP_BPM = 8;

export interface HeartRateSessionRpcSession {
  started_at: string;
  ended_at: string;
  local_date: string;
  timezone: string;
  duration_seconds: number;
  avg_bpm: number | null;
  min_bpm: number | null;
  max_bpm: number | null;
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  hr_drop: number | null;
  beat_count: number | null;
  stress: number | null;
}

export interface HeartRateSessionRpcSample {
  offset_ms: number;
  bpm: number;
  signal_quality: number | null;
}

export interface HeartRateSessionRpcIbiSample {
  offset_ms: number;
  ibi_ms: number;
  signal_quality: number | null;
}

export interface CompleteHeartRateSessionRpcSession
  extends HeartRateSessionRpcSession {
  ibi_samples: HeartRateSessionRpcIbiSample[];
}

export interface CompleteHeartRateSessionRpcArgs {
  p_session: CompleteHeartRateSessionRpcSession;
  p_samples: HeartRateSessionRpcSample[];
}

interface BuildHeartRateSessionRpcPayloadOptions {
  timezone: string;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampBpmStep(value: number, previous: number | null): number {
  if (previous == null) return value;
  if (Math.abs(value - previous) <= MAX_SAMPLE_JUMP_BPM) return value;
  return previous + Math.sign(value - previous) * MAX_SAMPLE_JUMP_BPM;
}

function clampQuality(value: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  return Math.min(1, Math.max(0, value));
}

function formatLocalDate(timestampMs: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestampMs));

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (year == null || month == null || day == null) {
    throw new Error(`Unable to format local date for timezone "${timezone}"`);
  }

  return `${year}-${month}-${day}`;
}

function mapIbiSamples(ibiSamples: IbiSample[]): HeartRateSessionRpcIbiSample[] {
  return ibiSamples
    .filter((sample) => (
      isFiniteNumber(sample.offsetMs) &&
      sample.offsetMs >= 0 &&
      isFiniteNumber(sample.ibiMs) &&
      sample.ibiMs > 0
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs)
    .map((sample) => ({
      offset_ms: Math.round(sample.offsetMs),
      ibi_ms: Math.round(sample.ibiMs),
      signal_quality: clampQuality(sample.signalQuality),
    }));
}

function buildBpmSamplesFromIbiSamples(
  ibiSamples: HeartRateSessionRpcIbiSample[],
): HeartRateSessionRpcSample[] {
  const instantaneousSamples = ibiSamples
    .map((sample) => ({
      offset_ms: sample.offset_ms,
      bpm: Math.round(60000 / sample.ibi_ms),
      signal_quality: sample.signal_quality,
    }))
    .filter((sample) => (
      isFiniteNumber(sample.bpm) &&
      sample.bpm >= 20 &&
      sample.bpm <= 240
    ));

  let previousBpm: number | null = null;
  return instantaneousSamples.map((sample) => {
    const bpm = Math.round(clampBpmStep(sample.bpm, previousBpm));
    previousBpm = bpm;
    return {
      ...sample,
      bpm,
    };
  });
}

function buildInstantaneousBpmSamplesFromIbiSamples(
  ibiSamples: HeartRateSessionRpcIbiSample[],
): HeartRateSessionRpcSample[] {
  return ibiSamples
    .map((sample) => ({
      offset_ms: sample.offset_ms,
      bpm: Math.round(60000 / sample.ibi_ms),
      signal_quality: sample.signal_quality,
    }))
    .filter((sample) => (
      isFiniteNumber(sample.bpm) &&
      sample.bpm >= 20 &&
      sample.bpm <= 240
    ));
}

function summarizeBpmSamples(samples: HeartRateSessionRpcSample[]): {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
} {
  if (samples.length === 0) {
    return {
      avgBpm: null,
      minBpm: null,
      maxBpm: null,
    };
  }

  const bpmValues = samples.map((sample) => sample.bpm);

  return {
    avgBpm: Math.round(bpmValues.reduce((sum, value) => sum + value, 0) / bpmValues.length),
    minBpm: Math.min(...bpmValues),
    maxBpm: Math.max(...bpmValues),
  };
}

export function buildHeartRateSessionRpcPayload(
  captureSamples: PpgFrameSample[],
  result: CaptureResult,
  options: BuildHeartRateSessionRpcPayloadOptions,
): CompleteHeartRateSessionRpcArgs | null {
  const reading = result.reading;
  if (reading == null) return null;

  const orderedSamples = [...captureSamples]
    .filter((sample) => isFiniteNumber(sample.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const startedAtMs = orderedSamples[0]?.timestamp;
  const endedAtMs = orderedSamples[orderedSamples.length - 1]?.timestamp;
  if (!isFiniteNumber(startedAtMs) || !isFiniteNumber(endedAtMs) || endedAtMs < startedAtMs) {
    return null;
  }

  const ibiSamples = mapIbiSamples(result.ibiSamples);
  const instantaneousBpmSamples = buildInstantaneousBpmSamplesFromIbiSamples(ibiSamples);
  const bpmSamples = buildBpmSamplesFromIbiSamples(ibiSamples);
  const bpmSummary = summarizeBpmSamples(instantaneousBpmSamples);
  const rawDurationMs = endedAtMs - startedAtMs;
  const durationMs =
    rawDurationMs > 0
      ? rawDurationMs
      : (isFiniteNumber(reading.durationMs) ? reading.durationMs : 0);

  return {
    p_session: {
      started_at: new Date(startedAtMs).toISOString(),
      ended_at: new Date(endedAtMs).toISOString(),
      local_date: formatLocalDate(endedAtMs, options.timezone),
      timezone: options.timezone,
      duration_seconds: Math.max(1, Math.round(durationMs / 1000)),
      avg_bpm: reading.bpm,
      min_bpm: bpmSummary.minBpm ?? reading.bpm,
      max_bpm: bpmSummary.maxBpm ?? reading.bpm,
      rmssd: reading.rmssd ?? null,
      sdnn: reading.sdnn ?? null,
      pnn50: reading.pnn50 ?? null,
      hr_drop: reading.hrDrop ?? null,
      beat_count: reading.beatCount ?? null,
      stress: reading.stress ?? null,
      ibi_samples: ibiSamples,
    },
    p_samples: bpmSamples,
  };
}
