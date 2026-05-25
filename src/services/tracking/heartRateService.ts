import type { CaptureResult, PpgFrameSample } from '../../lib/heartRate/types';
import { buildHeartRateSessionRpcPayload } from '../../lib/heartRate/sessionPayload';
import { logNetworkFailureDiagnostics } from '../debug/networkFailureDiagnostics';
import { requireSupabaseClient } from '../supabase';
import type { Database, Json } from '../supabase/database.types';
import type {
  HeartRatePoint,
  HeartRateSessionDetail,
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from './types';

export interface CompleteHeartRateSessionInput {
  captureSamples: PpgFrameSample[];
  result: CaptureResult;
  timezone: string;
}

type HeartRateRow =
  | Database['public']['Views']['user_today_heart_rate_v']['Row']
  | Database['public']['Tables']['heart_rate_sessions']['Row'];
type HeartRateSessionRow = Database['public']['Tables']['heart_rate_sessions']['Row'];
type HeartRateSampleRow = Database['public']['Tables']['heart_rate_samples']['Row'];
type HeartRateIbiRow = Database['public']['Views']['user_today_heart_rate_ibi_samples_v']['Row'];
type HeartRateIbiSampleRow = Database['public']['Tables']['heart_rate_ibi_samples']['Row'];

export async function completeHeartRateSession(
  input: CompleteHeartRateSessionInput,
): Promise<string> {
  const startedAt = Date.now();
  console.log('[heart-rate-save] service payload build started', {
    sampleCount: input.captureSamples.length,
    timezone: input.timezone,
    hasReading: input.result.reading != null,
  });

  const args = buildHeartRateSessionRpcPayload(
    input.captureSamples,
    input.result,
    { timezone: input.timezone },
  );

  if (args == null) {
    console.warn('[heart-rate-save] service payload build failed', {
      elapsedMs: Date.now() - startedAt,
    });
    throw new Error('Cannot persist a heart-rate session without a valid reading.');
  }

  const supabase = requireSupabaseClient();

  console.log('[heart-rate-save] rpc request started', {
    sampleCount: input.captureSamples.length,
  });

  const rpcStartedAt = Date.now();
  const { data, error } = await supabase.rpc('complete_heart_rate_session', {
    p_session: args.p_session as unknown as Json,
    p_samples: args.p_samples as unknown as Json,
  });

  if (error != null) {
    console.warn('[heart-rate-save] rpc request failed', {
      elapsedMs: Date.now() - rpcStartedAt,
      totalElapsedMs: Date.now() - startedAt,
      errorMessage: getErrorMessage(error),
    });
    await logNetworkFailureDiagnostics(
      '[heart-rate-save] rpc request diagnostics',
      {
        elapsedMs: Date.now() - rpcStartedAt,
        requestType: 'rpc.complete_heart_rate_session',
        error,
      },
    );
    throw error;
  }

  console.log('[heart-rate-save] rpc request succeeded', {
    sessionId: data,
    elapsedMs: Date.now() - rpcStartedAt,
    totalElapsedMs: Date.now() - startedAt,
  });

  return data;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
}

function mapHeartRateSummary(
  row: HeartRateRow | HeartRateSessionRow,
): TodayHeartRateSummary | null {
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
    stress: row.stress ?? deriveStressFromStoredSummary(row.rmssd, row.avg_bpm),
  };
}

function deriveStressFromStoredSummary(
  rmssd: number | null,
  avgBpm: number | null,
): number | null {
  if (rmssd == null || avgBpm == null) return null;

  const rmssdScore = Math.max(0, 100 - (rmssd / 60) * 100);
  const hrScore = Math.max(0, ((avgBpm - 50) / 30) * 100);
  return Math.max(0, Math.min(100, Math.round(rmssdScore * 0.7 + hrScore * 0.3)));
}

export async function getTodayHeartRateSummary(
  userId: string,
): Promise<TodayHeartRateSummary | null> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('user_today_heart_rate_v')
    .select('id, started_at, ended_at, local_date, timezone, duration_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count, stress')
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

  return mapHeartRateSummary(data as HeartRateRow);
}

export async function getHeartRateSummaryForDate(
  userId: string,
  localDate: string,
): Promise<TodayHeartRateSummary | null> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('heart_rate_sessions')
    .select('id, started_at, ended_at, local_date, timezone, duration_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count, stress')
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    return null;
  }

  return mapHeartRateSummary(data as HeartRateRow);
}

export async function getRecentHeartRateSummaries(
  userId: string,
  limit = 3,
): Promise<TodayHeartRateSummary[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('heart_rate_sessions')
    .select('id, started_at, ended_at, local_date, timezone, duration_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count, stress')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error != null) {
    throw error;
  }

  return ((data ?? []) as HeartRateSessionRow[])
    .map(mapHeartRateSummary)
    .filter((summary): summary is TodayHeartRateSummary => summary != null);
}

export async function getHeartRateSessionDetail(
  userId: string,
  sessionId: string,
): Promise<HeartRateSessionDetail | null> {
  const supabase = requireSupabaseClient();

  const { data: sessionData, error: sessionError } = await supabase
    .from('heart_rate_sessions')
    .select('id, started_at, ended_at, local_date, timezone, duration_seconds, avg_bpm, min_bpm, max_bpm, rmssd, sdnn, pnn50, hr_drop, beat_count, stress')
    .eq('user_id', userId)
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError != null) {
    throw sessionError;
  }

  if (sessionData == null) {
    return null;
  }

  const summary = mapHeartRateSummary(sessionData as HeartRateSessionRow);
  if (summary == null) {
    return null;
  }

  const [bpmResult, ibiResult] = await Promise.all([
    supabase
      .from('heart_rate_samples')
      .select('offset_ms, bpm, signal_quality')
      .eq('user_id', userId)
      .eq('heart_rate_session_id', sessionId)
      .order('offset_ms', { ascending: true }),
    supabase
      .from('heart_rate_ibi_samples')
      .select('offset_ms, ibi_ms, signal_quality')
      .eq('user_id', userId)
      .eq('heart_rate_session_id', sessionId)
      .order('offset_ms', { ascending: true }),
  ]);

  if (bpmResult.error != null) {
    throw bpmResult.error;
  }

  if (ibiResult.error != null) {
    throw ibiResult.error;
  }

  const bpmSeries: HeartRatePoint[] = ((bpmResult.data ?? []) as HeartRateSampleRow[])
    .filter((row) => row.offset_ms != null && row.bpm != null)
    .map((row) => ({
      offsetMs: row.offset_ms,
      bpm: row.bpm,
      signalQuality: row.signal_quality,
    }));

  const ibiSeries: HeartRateIbiPoint[] = ((ibiResult.data ?? []) as HeartRateIbiSampleRow[])
    .filter((row) => row.offset_ms != null && row.ibi_ms != null)
    .map((row) => ({
      offsetMs: row.offset_ms,
      ibiMs: row.ibi_ms,
      signalQuality: row.signal_quality,
    }));

  return {
    ...summary,
    bpmSeries,
    ibiSeries,
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
