import { requireSupabaseClient } from '../supabase';
import type { BreathingSessionSummary } from './types';

export interface BreathingSessionBpmSampleInput {
  offsetMs: number;
  bpm: number;
  signalQuality: number | null;
}

export interface CompleteBreathingSessionInput {
  techniqueId: string;
  startedAt: string;
  endedAt: string;
  localDate: string;
  timezone: string;
  durationSeconds: number;
  roundsCompleted: number | null;
  targetRounds: number | null;
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  completed: boolean;
  samples?: BreathingSessionBpmSampleInput[];
}

export async function completeBreathingSession(
  input: CompleteBreathingSessionInput,
): Promise<string> {
  void input;
  return 'mock-breathing-session';
}

export async function getRecentBreathingSessions(): Promise<BreathingSessionSummary[]> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getRecentBreathingSessions is scaffolded but not wired yet. Read from `breathing_sessions` scoped by the authenticated user.',
  );
}
