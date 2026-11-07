import { requireSupabaseClient } from '../supabase';
import type { TrialRecapCounts } from './notificationCatalog';

const TRIAL_RECAP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function countOrThrow({ count, error }: { count: number | null; error: unknown }): number {
  if (error != null) throw error;
  return count ?? 0;
}

export async function getTrialRecapCounts(
  userId: string,
  trialEndsAt: string,
): Promise<TrialRecapCounts> {
  const supabase = requireSupabaseClient();
  const since = new Date(new Date(trialEndsAt).getTime() - TRIAL_RECAP_WINDOW_MS).toISOString();
  const [planSteps, todos, checkIns] = await Promise.all([
    supabase
      .from('program_action_completions')
      .select('activity_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', since)
      // A claimed to-do step is already counted as a to-do.
      .not('activity_id', 'like', 'todo:%'),
    supabase
      .from('self_care_goal_completions')
      .select('goal_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', since),
    supabase
      .from('mood_check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since),
  ]);
  return {
    planSteps: countOrThrow(planSteps),
    todos: countOrThrow(todos),
    checkIns: countOrThrow(checkIns),
  };
}
