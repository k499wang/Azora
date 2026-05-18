import { requireSupabaseClient } from '../supabase';
import type { Json } from '../supabase/database.types';
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

function mapSamples(
  samples: BreathingSessionBpmSampleInput[] | undefined,
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

export async function completeBreathingSession(
  input: CompleteBreathingSessionInput,
): Promise<string> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase.rpc('complete_breathing_session', {
    p_session: {
      technique_id: input.techniqueId,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      local_date: input.localDate,
      timezone: input.timezone,
      duration_seconds: Math.max(0, Math.round(input.durationSeconds)),
      rounds_completed: nullableInt(input.roundsCompleted),
      target_rounds: nullableInt(input.targetRounds),
      avg_bpm: nullableBpm(input.avgBpm),
      min_bpm: nullableBpm(input.minBpm),
      max_bpm: nullableBpm(input.maxBpm),
      completed: input.completed,
    } as unknown as Json,
    p_samples: mapSamples(input.samples) as unknown as Json,
  });

  if (error != null) {
    throw error;
  }

  return data;
}

export async function getRecentBreathingSessions(): Promise<BreathingSessionSummary[]> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getRecentBreathingSessions is scaffolded but not wired yet. Read from `breathing_sessions` scoped by the authenticated user.',
  );
}
