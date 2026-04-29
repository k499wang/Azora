import { requireSupabaseClient } from '../supabase';
import type { Database } from '../supabase/database.types';

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastQualifiedDate: string | null;
}

type StreakRow = Database['public']['Views']['user_streaks_v']['Row'];

export async function getStreakSummary(userId: string): Promise<StreakSummary | null> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('user_streaks_v')
    .select('current_streak, longest_streak, last_qualified_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    return null;
  }

  const row = data as StreakRow;

  return {
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastQualifiedDate: row.last_qualified_date,
  };
}
