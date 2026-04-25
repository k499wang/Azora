import { requireSupabaseClient } from '../supabase';
import type { BreathingSessionSummary } from './types';

export interface CompleteBreathingSessionInput {
  // Add the pure breathing-session RPC payload mapper here when that write path is implemented.
  session: Record<string, unknown>;
  samples?: Array<Record<string, unknown>>;
}

export async function completeBreathingSession(
  _input: CompleteBreathingSessionInput,
): Promise<string> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'completeBreathingSession is scaffolded but not wired yet. This should call `complete_breathing_session` through a pure payload mapper.',
  );
}

export async function getRecentBreathingSessions(): Promise<BreathingSessionSummary[]> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getRecentBreathingSessions is scaffolded but not wired yet. Read from `breathing_sessions` scoped by the authenticated user.',
  );
}
