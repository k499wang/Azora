import { buildNetworkFailureDiagnostics } from '../debug/networkFailureDiagnostics';
import { requireSupabaseClient } from '../supabase';
import type { Database, Json } from '../supabase/database.types';
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  HeartRatePoint,
} from './types';

export interface BreathHoldBpmSampleInput {
  offsetMs: number;
  bpm: number;
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
  azoraScore: number | null;
  samples?: BreathHoldBpmSampleInput[];
}

type BreathHoldRow =
  | Database['public']['Views']['user_today_breath_hold_v']['Row']
  | Database['public']['Tables']['breath_hold_sessions']['Row'];
type DailyActivityRow = Database['public']['Tables']['daily_activity']['Row'];

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

function nullableAzoraScore(value: number | null): number | null {
  if (!isFiniteNumber(value)) return null;
  const rounded = Math.round(value);
  return rounded >= 0 && rounded <= 100 ? rounded : null;
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

export async function completeBreathHold(
  input: CompleteBreathHoldInput,
): Promise<string> {
  const startedAt = Date.now();
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
      lung_age: nullableAzoraScore(input.azoraScore),
      score_version: 1,
      notes: null,
    } as unknown as Json,
    p_samples: mapSamples(input.samples) as unknown as Json,
  });

  if (error != null) {
    const postgrest = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const looksEmpty =
      !postgrest.code &&
      !postgrest.message &&
      !postgrest.details &&
      !postgrest.hint;
    if (looksEmpty) {
      const cause = error as unknown as { cause?: unknown; name?: string };
      const underlying = (cause?.cause ?? error) as {
        name?: string;
        message?: string;
        status?: number;
      };
      const wrapped = new Error(
        `complete_breath_hold transport failure: ${underlying?.name ?? 'Error'}${
          underlying?.message ? `: ${underlying.message}` : ''
        }${underlying?.status != null ? ` (status=${underlying.status})` : ''}`,
      );
      (wrapped as Error & { cause?: unknown }).cause = error;
      console.warn(
        '[breath-hold-save] rpc request diagnostics',
        await buildNetworkFailureDiagnostics({
          elapsedMs: Date.now() - startedAt,
          requestType: 'rpc.complete_breath_hold',
          error: wrapped,
        }),
      );
      throw wrapped;
    }
    console.warn(
      '[breath-hold-save] rpc request diagnostics',
      await buildNetworkFailureDiagnostics({
        elapsedMs: Date.now() - startedAt,
        requestType: 'rpc.complete_breath_hold',
        error,
      }),
    );
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
    .select('id, started_at, ended_at, local_date, timezone, hold_seconds, avg_bpm, min_bpm, max_bpm')
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
    .select('id, started_at, ended_at, local_date, timezone, hold_seconds, avg_bpm, min_bpm, max_bpm')
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

export async function getRecentBreathHoldSummaries(
  userId: string,
  limit = 15,
): Promise<BreathHoldSummary[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('breath_hold_sessions')
    .select('id, started_at, ended_at, local_date, timezone, hold_seconds, avg_bpm, min_bpm, max_bpm')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error != null) {
    throw error;
  }

  return ((data ?? []) as BreathHoldRow[])
    .map(mapBreathHoldSummary)
    .filter((s): s is BreathHoldSummary => s != null);
}

export async function getBreathHoldBpmSeriesForSession(
  userId: string,
  sessionId: string,
): Promise<HeartRatePoint[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('heart_rate_samples')
    .select('offset_ms, bpm, signal_quality')
    .eq('user_id', userId)
    .eq('breath_hold_session_id', sessionId)
    .order('offset_ms', { ascending: true });

  if (error != null) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    offsetMs: row.offset_ms,
    bpm: row.bpm,
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
