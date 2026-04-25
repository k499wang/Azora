import { requireSupabaseClient } from '../supabase';
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

export async function completeBreathHold(
  _input: CompleteBreathHoldInput,
): Promise<string> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'completeBreathHold is scaffolded but not wired yet. This should call `complete_breath_hold` through a pure payload mapper.',
  );
}

export async function getTodayBreathHoldSummary(): Promise<BreathHoldSummary | null> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getTodayBreathHoldSummary is scaffolded but not wired yet. Read from `user_today_breath_hold_v`.',
  );
}

export async function getTodayBreathHoldIbiSeries(): Promise<HeartRateIbiPoint[]> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getTodayBreathHoldIbiSeries is scaffolded but not wired yet. Read from `user_today_breath_hold_ibi_samples_v`.',
  );
}

export async function getDailyActivityRange(): Promise<DailyActivitySummary[]> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getDailyActivityRange is scaffolded but not wired yet. Read recent `daily_activity` rows for the authenticated user.',
  );
}
