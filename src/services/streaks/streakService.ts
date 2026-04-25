import { requireSupabaseClient } from '../supabase';

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastQualifiedDate: string | null;
}

export async function getStreakSummary(): Promise<StreakSummary | null> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getStreakSummary is scaffolded but not wired yet. Read from `user_streaks_v`.',
  );
}
