import type { CaptureResult, PpgFrameSample } from '../../lib/heartRate/types';
import { buildHeartRateSessionRpcPayload } from '../../lib/heartRate/sessionPayload';
import { requireSupabaseClient } from '../supabase';
import type { Database } from '../supabase/database.types';
import type {
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from './types';

export interface CompleteHeartRateSessionInput {
  captureSamples: PpgFrameSample[];
  result: CaptureResult;
  timezone: string;
}

type HeartRateRow = Database['public']['Views']['user_today_heart_rate_v']['Row'];
type HeartRateIbiRow = Database['public']['Views']['user_today_heart_rate_ibi_samples_v']['Row'];

export async function completeHeartRateSession(
  input: CompleteHeartRateSessionInput,
): Promise<string> {
  const args = buildHeartRateSessionRpcPayload(
    input.captureSamples,
    input.result,
    { timezone: input.timezone },
  );

  if (args == null) {
    throw new Error('Cannot persist a heart-rate session without a valid reading.');
  }

  const supabase = requireSupabaseClient();
  void supabase;
  void args;

  throw new Error(
    'completeHeartRateSession is scaffolded but not wired yet. Call `supabase.rpc("complete_heart_rate_session", args)` here once the real client is installed.',
  );
}

export async function getTodayHeartRateSummary(
  userId: string,
): Promise<TodayHeartRateSummary | null> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('user_today_heart_rate_v')
    .select('id, started_at, ended_at, local_date, timezone, duration_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    return null;
  }

  const row = data as HeartRateRow;

  if (
    row.id == null ||
    row.started_at == null ||
    row.local_date == null ||
    row.timezone == null ||
    row.duration_seconds == null
  ) {
    return null;
  }

  return {
    sessionId: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    localDate: row.local_date,
    timezone: row.timezone,
    durationSeconds: row.duration_seconds,
    avgBpm: row.avg_bpm,
    minBpm: row.min_bpm,
    maxBpm: row.max_bpm,
    rmssd: row.rmssd,
    sdnn: row.sdnn,
    pnn50: row.pnn50,
    hrDrop: row.hr_drop,
    beatCount: row.beat_count,
  };
}

export async function getTodayHeartRateIbiSeries(
  userId: string,
): Promise<HeartRateIbiPoint[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('user_today_heart_rate_ibi_samples_v')
    .select('offset_ms, ibi_ms, signal_quality')
    .eq('user_id', userId)
    .order('offset_ms', { ascending: true });

  if (error != null) {
    throw error;
  }

  return ((data ?? []) as HeartRateIbiRow[])
    .filter((row) => row.offset_ms != null && row.ibi_ms != null)
    .map((row) => ({
      offsetMs: row.offset_ms as number,
      ibiMs: row.ibi_ms as number,
      signalQuality: row.signal_quality,
    }));
}
