import { requireSupabaseClient } from '../supabase';
import {
  normalizeSelfCareGoalTitle,
  sortSelfCareGoals,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';

interface GoalRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

function mapGoal(row: GoalRow, completedGoalIds: Set<string>): SelfCareGoal {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedToday: completedGoalIds.has(row.id),
  };
}

export async function getSelfCareGoals(
  userId: string,
  localDate: string,
): Promise<SelfCareGoal[]> {
  const supabase = requireSupabaseClient();
  const [goalsResult, completionsResult] = await Promise.all([
    supabase
      .from('self_care_goals')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('self_care_goal_completions')
      .select('goal_id')
      .eq('user_id', userId)
      .eq('local_date', localDate),
  ]);

  if (goalsResult.error != null) throw goalsResult.error;
  if (completionsResult.error != null) throw completionsResult.error;

  const completedGoalIds = new Set(
    (completionsResult.data ?? []).map((row) => row.goal_id),
  );
  return sortSelfCareGoals(
    (goalsResult.data ?? []).map((row) => mapGoal(row, completedGoalIds)),
  );
}

export async function createSelfCareGoal(
  userId: string,
  title: string,
): Promise<SelfCareGoal> {
  const normalizedTitle = normalizeSelfCareGoalTitle(title);
  if (normalizedTitle == null) throw new Error('Enter a shorter to-do.');

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('self_care_goals')
    .insert({ user_id: userId, title: normalizedTitle })
    .select('id, title, created_at, updated_at')
    .single();
  if (error != null) throw error;

  return mapGoal(data, new Set());
}

export async function setSelfCareGoalCompleted(
  userId: string,
  goalId: string,
  localDate: string,
  completed: boolean,
): Promise<void> {
  const supabase = requireSupabaseClient();
  if (completed) {
    const { error } = await supabase.from('self_care_goal_completions').upsert(
      { goal_id: goalId, user_id: userId, local_date: localDate },
      { onConflict: 'goal_id,local_date' },
    );
    if (error != null) throw error;
    return;
  }

  const { error } = await supabase
    .from('self_care_goal_completions')
    .delete()
    .eq('goal_id', goalId)
    .eq('user_id', userId)
    .eq('local_date', localDate);
  if (error != null) throw error;
}

export async function archiveSelfCareGoal(
  userId: string,
  goalId: string,
): Promise<void> {
  const supabase = requireSupabaseClient();
  const { error } = await supabase
    .from('self_care_goals')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error != null) throw error;
}
