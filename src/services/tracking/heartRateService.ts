import type { CaptureResult, PpgFrameSample } from '../../lib/heartRate/types';
import { buildHeartRateSessionRpcPayload } from '../../lib/heartRate/sessionPayload';
import { requireSupabaseClient } from '../supabase';
import type {
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from './types';

export interface CompleteHeartRateSessionInput {
  captureSamples: PpgFrameSample[];
  result: CaptureResult;
  timezone: string;
}

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

export async function getTodayHeartRateSummary(): Promise<TodayHeartRateSummary | null> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getTodayHeartRateSummary is scaffolded but not wired yet. Read from `user_today_heart_rate_v`.',
  );
}

export async function getTodayHeartRateIbiSeries(): Promise<HeartRateIbiPoint[]> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getTodayHeartRateIbiSeries is scaffolded but not wired yet. Read from `user_today_heart_rate_ibi_samples_v` ordered by `offset_ms`.',
  );
}
