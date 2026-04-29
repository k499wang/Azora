import { requireSupabaseClient } from '../supabase';
import type { Database } from '../supabase/database.types';
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  HeartRateIbiPoint,
} from './types';

export interface CompleteBreathHoldInput {
  // Add the pure breath-hold RPC payload mapper here when that write path is implemented.
  session: Record<string, unknown>;
  samples?: Array<Record<string, unknown>>;
}

type BreathHoldRow = Database['public']['Views']['user_today_breath_hold_v']['Row'];
type DailyActivityRow = Database['public']['Tables']['daily_activity']['Row'];

export async function completeBreathHold(
  _input: CompleteBreathHoldInput,
): Promise<string> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'completeBreathHold is scaffolded but not wired yet. This should call `complete_breath_hold` through a pure payload mapper.',
  );
}

function mapBreathHoldSummary(
  row: BreathHoldRow,
): BreathHoldSummary {
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
    .select('id, started_at, ended_at, local_date, timezone, hold_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count')
    .eq('user_id', userId)
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

  return ((data ?? []) as Database['public']['Views']['user_today_breath_hold_ibi_samples_v']['Row'][]).map((row) => ({
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
