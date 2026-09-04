import { requireSupabaseClient } from '../supabase';
import {
  normalizeSelfCareGoalTitle,
  resolveSelfCareGoalIcon,
  sortSelfCareGoals,
  type SelfCareGoal,
} from '../../features/selfCare/domain/selfCareGoal';
import type { IconName } from '../../components/common/icons/paths';

const GOAL_COLUMNS = 'id, title, icon, featured_on, created_at, updated_at';

interface GoalRow {
  id: string;
  title: string;
  icon: string | null;
  featured_on: string | null;
  created_at: string;
  updated_at: string;
}

function mapGoal(
  row: GoalRow,
  completedGoalIds: Set<string>,
  localDate: string,
): SelfCareGoal {
  return {
    id: row.id,
    title: row.title,
    icon: resolveSelfCareGoalIcon(row.icon),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedToday: completedGoalIds.has(row.id),
    // Yesterday's pick is simply not today's, so the column needs no clearing.
    featuredToday: row.featured_on === localDate,
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
      .select(GOAL_COLUMNS)
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
    (goalsResult.data ?? []).map((row) =>
      mapGoal(row, completedGoalIds, localDate),
    ),
  );
}

export async function createSelfCareGoal(
  userId: string,
  title: string,
  icon: IconName,
  localDate: string,
): Promise<SelfCareGoal> {
  const normalizedTitle = normalizeSelfCareGoalTitle(title);
  if (normalizedTitle == null) throw new Error('Enter a shorter to-do.');

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('self_care_goals')
    .insert({ user_id: userId, title: normalizedTitle, icon })
    .select(GOAL_COLUMNS)
    .single();
  if (error != null) throw error;

  return mapGoal(data, new Set(), localDate);
}

/**
 * Moves the day's one task-of-the-day marker onto this goal, or clears it.
 *
 * The current holder is let go first either way: only one row per user per day
 * may carry the date, so handing the title over cannot overlap.
 */
export async function setSelfCareGoalFeatured(
  userId: string,
  goalId: string,
  localDate: string,
  featured: boolean,
): Promise<void> {
  const supabase = requireSupabaseClient();
  const { error: clearError } = await supabase
    .from('self_care_goals')
    .update({ featured_on: null })
    .eq('user_id', userId)
    .eq('featured_on', localDate);
  if (clearError != null) throw clearError;
  if (!featured) return;

  const { error } = await supabase
    .from('self_care_goals')
    .update({ featured_on: localDate })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error != null) throw error;
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
