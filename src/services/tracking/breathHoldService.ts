import { requireSupabaseClient } from '../supabase';
import type { Database, Json } from '../supabase/database.types';
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  HeartRateIbiPoint,
} from './types';

export interface BreathHoldBpmSampleInput {
  offsetMs: number;
  bpm: number;
  signalQuality: number | null;
}

export interface BreathHoldIbiSampleInput {
  offsetMs: number;
  ibiMs: number;
  signalQuality: number | null;
}

export interface CompleteBreathHoldInput {
  startedAt: string;
  endedAt: string;
  localDate: string;
  timezone: string;
  inhaleSeconds: number | null;
  holdSeconds: number;
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  lungAge: number | null;
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  hrDrop: number | null;
  beatCount: number | null;
  stress: number | null;
  samples?: BreathHoldBpmSampleInput[];
  ibiSamples?: BreathHoldIbiSampleInput[];
}

type BreathHoldRow =
  | Database['public']['Views']['user_today_breath_hold_v']['Row']
  | Database['public']['Tables']['breath_hold_sessions']['Row'];
type DailyActivityRow = Database['public']['Tables']['daily_activity']['Row'];
type HeartRateIbiSampleRow = Database['public']['Tables']['heart_rate_ibi_samples']['Row'];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function nullableInt(value: number | null): number | null {
  return isFiniteNumber(value) ? Math.round(value) : null;
}

function nullableBpm(value: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  const rounded = Math.round(value);
  return rounded >= 20 && rounded <= 240 ? rounded : null;
}

function nullableLungAge(value: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  const rounded = Math.round(value);
  return rounded >= 1 && rounded <= 120 ? rounded : null;
}

function nullablePercent(value: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function nullableHrDrop(value: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  return Math.max(-240, Math.min(240, Math.round(value)));
}

function nullableHrvMs(value: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  return Math.max(0, Math.min(500, Math.round(value)));
}

function mapSamples(
  samples: BreathHoldBpmSampleInput[] | undefined,
): Array<{ offset_ms: number; bpm: number; signal_quality: number | null }> {
  return (samples ?? [])
    .filter((sample) => (
      isFiniteNumber(sample.offsetMs) &&
      sample.offsetMs >= 0 &&
      isFiniteNumber(sample.bpm) &&
      sample.bpm >= 20 &&
      sample.bpm <= 240
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs)
    .map((sample) => ({
      offset_ms: Math.round(sample.offsetMs),
      bpm: Math.round(sample.bpm),
      signal_quality: isFiniteNumber(sample.signalQuality)
        ? Math.min(1, Math.max(0, sample.signalQuality))
        : null,
    }));
}

function mapIbiSamples(
  samples: BreathHoldIbiSampleInput[] | undefined,
): Array<{ offset_ms: number; ibi_ms: number; signal_quality: number | null }> {
  return (samples ?? [])
    .filter((sample) => (
      isFiniteNumber(sample.offsetMs) &&
      sample.offsetMs >= 0 &&
      isFiniteNumber(sample.ibiMs) &&
      sample.ibiMs >= 300 &&
      sample.ibiMs <= 2000
    ))
    .sort((a, b) => a.offsetMs - b.offsetMs)
    .map((sample) => ({
      offset_ms: Math.round(sample.offsetMs),
      ibi_ms: Math.round(sample.ibiMs),
      signal_quality: isFiniteNumber(sample.signalQuality)
        ? Math.min(1, Math.max(0, sample.signalQuality))
        : null,
    }));
}

export async function completeBreathHold(
  input: CompleteBreathHoldInput,
): Promise<string> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase.rpc('complete_breath_hold', {
    p_session: {
      started_at: input.startedAt,
      ended_at: input.endedAt,
      local_date: input.localDate,
      timezone: input.timezone,
      inhale_seconds: nullableInt(input.inhaleSeconds),
      hold_seconds: Math.max(0, Math.round(input.holdSeconds)),
      recovery_seconds: null,
      avg_bpm: nullableBpm(input.avgBpm),
      min_bpm: nullableBpm(input.minBpm),
      max_bpm: nullableBpm(input.maxBpm),
      health_score: null,
      lung_age: nullableLungAge(input.lungAge),
      score_version: 1,
      notes: null,
      rmssd: nullableHrvMs(input.rmssd),
      sdnn: nullableHrvMs(input.sdnn),
      pnn50: nullablePercent(input.pnn50),
      hr_drop: nullableHrDrop(input.hrDrop),
      beat_count: nullableInt(input.beatCount),
      stress: nullablePercent(input.stress),
      ibi_samples: mapIbiSamples(input.ibiSamples),
    } as unknown as Json,
    p_samples: mapSamples(input.samples) as unknown as Json,
  });

  if (error != null) {
    throw error;
  }

  return data;
}

function mapBreathHoldSummary(
  row: BreathHoldRow,
): BreathHoldSummary | null {
  if (
    row.id == null ||
    row.started_at == null ||
    row.local_date == null ||
    row.timezone == null ||
    row.hold_seconds == null
  ) {
    return null;
  }

  return {
    sessionId: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    localDate: row.local_date,
    timezone: row.timezone,
    holdSeconds: row.hold_seconds,
    avgBpm: row.avg_bpm,
    minBpm: row.min_bpm,
    maxBpm: row.max_bpm,
    rmssd: row.rmssd ?? null,
    sdnn: row.sdnn ?? null,
    pnn50: row.pnn50 ?? null,
    hrDrop: row.hr_drop ?? null,
    beatCount: row.beat_count ?? null,
    stress: row.stress ?? null,
  };
}

function mapDailyActivity(
  row: DailyActivityRow,
): DailyActivitySummary {
  return {
    activityDate: row.activity_date,
    timezone: row.timezone,
    dailyBreathHoldCompleted: row.daily_breath_hold_completed,
    breathHoldCount: row.breath_hold_count,
    bestHoldSeconds: row.best_hold_seconds,
    breathingSessionCount: row.breathing_session_count,
    breathingSeconds: row.breathing_seconds,
    heartRateCaptureCount: row.heart_rate_capture_count,
    qualifiesForStreak: row.qualifies_for_streak,
  };
}

export async function getTodayBreathHoldSummary(
  userId: string,
): Promise<BreathHoldSummary | null> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('user_today_breath_hold_v')
    .select('id, started_at, ended_at, local_date, timezone, hold_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count, stress')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data == null ? null : mapBreathHoldSummary(data as BreathHoldRow);
}

export async function getBreathHoldSummaryForDate(
  userId: string,
  localDate: string,
): Promise<BreathHoldSummary | null> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('breath_hold_sessions')
    .select('id, started_at, ended_at, local_date, timezone, hold_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count, stress')
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data == null ? null : mapBreathHoldSummary(data as BreathHoldRow);
}

export async function getTodayBreathHoldIbiSeries(
  userId: string,
): Promise<HeartRateIbiPoint[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('user_today_breath_hold_ibi_samples_v')
    .select('offset_ms, ibi_ms, signal_quality')
    .eq('user_id', userId)
    .order('offset_ms', { ascending: true });

  if (error != null) {
    throw error;
  }

  return ((data ?? []) as Database['public']['Views']['user_today_breath_hold_ibi_samples_v']['Row'][])
    .filter((row) => row.offset_ms != null && row.ibi_ms != null)
    .map((row) => ({
      offsetMs: row.offset_ms as number,
      ibiMs: row.ibi_ms as number,
      signalQuality: row.signal_quality,
    }));
}

export async function getBreathHoldIbiSeries(
  userId: string,
  breathHoldSessionId: string | null,
): Promise<HeartRateIbiPoint[]> {
  if (breathHoldSessionId == null) {
    return [];
  }

  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('heart_rate_ibi_samples')
    .select('offset_ms, ibi_ms, signal_quality')
    .eq('user_id', userId)
    .eq('breath_hold_session_id', breathHoldSessionId)
    .order('offset_ms', { ascending: true });

  if (error != null) {
    throw error;
  }

  return ((data ?? []) as HeartRateIbiSampleRow[])
    .filter((row) => row.offset_ms != null && row.ibi_ms != null)
    .map((row) => ({
      offsetMs: row.offset_ms,
      ibiMs: row.ibi_ms,
      signalQuality: row.signal_quality,
    }));
}

export async function getDailyActivityRange(
  userId: string,
  limit = 28,
): Promise<DailyActivitySummary[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('daily_activity')
    .select('activity_date, timezone, daily_breath_hold_completed, breath_hold_count, best_hold_seconds, breathing_session_count, breathing_seconds, heart_rate_capture_count, qualifies_for_streak')
    .eq('user_id', userId)
    .order('activity_date', { ascending: false })
    .limit(limit);

  if (error != null) {
    throw error;
  }

  return ((data ?? []) as DailyActivityRow[]).map(mapDailyActivity);
}
