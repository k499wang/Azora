import type { CaptureResult, IbiSample, PpgFrameSample } from './types';

const MAX_SAMPLE_JUMP_BPM = 8;
const GRAPH_BPM_MEDIAN_WINDOW = 5;

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
  idempotency_key: string;
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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
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

export function mapIbiSamples(ibiSamples: IbiSample[]): HeartRateSessionRpcIbiSample[] {
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

export function buildBpmSamplesFromIbiSamples(
  ibiSamples: HeartRateSessionRpcIbiSample[],
): HeartRateSessionRpcSample[] {
  const graphSamples = ibiSamples
    .map((sample, index) => {
      const windowStart = Math.max(0, index - GRAPH_BPM_MEDIAN_WINDOW + 1);
      const recentIbis = ibiSamples
        .slice(windowStart, index + 1)
        .map((item) => item.ibi_ms)
        .filter((ibiMs) => isFiniteNumber(ibiMs) && ibiMs > 0);

      return {
        offset_ms: sample.offset_ms,
        bpm: Math.round(60000 / median(recentIbis)),
        signal_quality: sample.signal_quality,
      };
    })
    .filter((sample) => (
      isFiniteNumber(sample.bpm) &&
      sample.bpm >= 20 &&
      sample.bpm <= 240
    ));

  let previousBpm: number | null = null;
  return graphSamples.map((sample) => {
    const bpm = Math.round(clampBpmStep(sample.bpm, previousBpm));
    previousBpm = bpm;
    return {
      ...sample,
      bpm,
    };
  });
}

export function buildInstantaneousBpmSamplesFromIbiSamples(
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

export interface HoldBpmSample {
  /** Whole seconds since the breath hold started. */
  t: number;
  bpm: number;
}

/**
 * Build BPM graph/summary samples from the live per-second BPM readings taken
 * during a breath hold. Unlike the IBI-derived builders this needs no
 * inter-beat timing — it is the BPM-only path used now that breath holds no
 * longer compute HRV.
 */
export function buildBpmSamplesFromHoldSeconds(
  samples: HoldBpmSample[],
): HeartRateSessionRpcSample[] {
  let previousBpm: number | null = null;
  return [...samples]
    .filter((sample) => (
      isFiniteNumber(sample.t) &&
      sample.t >= 0 &&
      isFiniteNumber(sample.bpm) &&
      sample.bpm >= 20 &&
      sample.bpm <= 240
    ))
    .sort((a, b) => a.t - b.t)
    .map((sample) => {
      const bpm = Math.round(clampBpmStep(sample.bpm, previousBpm));
      previousBpm = bpm;
      return {
        offset_ms: Math.round(sample.t * 1000),
        bpm,
        signal_quality: null,
      };
    });
}

export function summarizeBpmSamples(samples: HeartRateSessionRpcSample[]): {
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

  const firstFrameTs = orderedSamples[0]?.timestamp;
  const lastFrameTs = orderedSamples[orderedSamples.length - 1]?.timestamp;
  if (!isFiniteNumber(firstFrameTs) || !isFiniteNumber(lastFrameTs) || lastFrameTs < firstFrameTs) {
    return null;
  }

  const ibiSamples = mapIbiSamples(result.ibiSamples);
  const instantaneousBpmSamples = buildInstantaneousBpmSamplesFromIbiSamples(ibiSamples);
  const bpmSamples = buildBpmSamplesFromIbiSamples(ibiSamples);
  const bpmSummary = summarizeBpmSamples(instantaneousBpmSamples);
  const rawDurationMs = lastFrameTs - firstFrameTs;
  const durationMs =
    rawDurationMs > 0
      ? rawDurationMs
      : (isFiniteNumber(reading.durationMs) ? reading.durationMs : 0);

  // Frame timestamps are a monotonic clock (ms since boot), not Unix epoch — only their
  // deltas are wall-clock-meaningful. Anchor session times to recordedAt (real wall-clock).
  const recordedAtMs = Date.parse(reading.recordedAt);
  const endedAtMs = Number.isFinite(recordedAtMs) ? recordedAtMs : Date.now();
  const startedAtMs = endedAtMs - durationMs;

  // Deterministic key from the reading's content: the same capture always
  // produces the same key, so a retry after a network blip dedups server-side
  // instead of inserting a duplicate row.
  const idempotencyKey = [
    reading.recordedAt,
    reading.bpm,
    reading.sampleCount,
    reading.durationMs,
  ].join(':');

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
      idempotency_key: idempotencyKey,
    },
    p_samples: bpmSamples,
  };
}
