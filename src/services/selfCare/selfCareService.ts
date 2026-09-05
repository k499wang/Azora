import { requireSupabaseClient } from '../supabase';
import {
  isSelfCareGoalDueOn,
  normalizeSelfCareGoalTitle,
  resolveSelfCareGoalIcon,
  resolveSelfCareGoalRecurrence,
  resolveSelfCareGoalTime,
  sortSelfCareGoals,
  type SelfCareGoal,
  type SelfCareGoalRecurrence,
} from '../../features/selfCare/domain/selfCareGoal';
import type { IconName } from '../../components/common/icons/paths';

const GOAL_COLUMNS =
  'id, title, icon, recurrence, scheduled_time, featured_on, created_at, updated_at';

interface GoalRow {
  id: string;
  title: string;
  icon: string | null;
  recurrence: string;
  scheduled_time: string | null;
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
    recurrence: resolveSelfCareGoalRecurrence(row.recurrence),
    scheduledTime: resolveSelfCareGoalTime(row.scheduled_time),
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
  const goals = (goalsResult.data ?? []).map((row) =>
    mapGoal(row, completedGoalIds, localDate),
  );
  const spentOnceGoalIds = await findSpentOnceGoalIds(
    userId,
    goals,
    localDate,
  );
  return sortSelfCareGoals(
    goals.filter((goal) =>
      isSelfCareGoalDueOn(goal, localDate, spentOnceGoalIds.has(goal.id)),
    ),
  );
}

/**
 * The one-offs that are already behind the user: finished on a day that is not
 * this one. Today's own completions are read with the rest of the day and stay
 * on the list, so this only asks about the other days, and only when the user
 * actually has a one-off to ask about.
 */
async function findSpentOnceGoalIds(
  userId: string,
  goals: SelfCareGoal[],
  localDate: string,
): Promise<Set<string>> {
  const onceGoalIds = goals
    .filter((goal) => goal.recurrence === 'once')
    .map((goal) => goal.id);
  if (onceGoalIds.length === 0) return new Set();

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('self_care_goal_completions')
    .select('goal_id')
    .eq('user_id', userId)
    .in('goal_id', onceGoalIds)
    .neq('local_date', localDate);
  if (error != null) throw error;

  return new Set((data ?? []).map((row) => row.goal_id));
}

/** The four things a to-do is written with, on the way in and on every edit. */
export interface SelfCareGoalDraft {
  title: string;
  icon: IconName;
  recurrence: SelfCareGoalRecurrence;
  /** 24-hour `HH:MM`, or null to take the hour back off the to-do */
  scheduledTime: string | null;
}

export async function createSelfCareGoal(
  userId: string,
  draft: SelfCareGoalDraft,
  localDate: string,
): Promise<SelfCareGoal> {
  const normalizedTitle = normalizeSelfCareGoalTitle(draft.title);
  if (normalizedTitle == null) throw new Error('Enter a shorter to-do.');

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('self_care_goals')
    .insert({
      user_id: userId,
      title: normalizedTitle,
      icon: draft.icon,
      recurrence: draft.recurrence,
      scheduled_time: draft.scheduledTime,
    })
    .select(GOAL_COLUMNS)
    .single();
  if (error != null) throw error;

  return mapGoal(data, new Set(), localDate);
}

/**
 * Writes a whole list in one insert. Onboarding's starter plan is a set, not a
 * sequence of unrelated rows: one statement means it either lands whole or not
 * at all, rather than leaving a half-written plan behind a failed round trip.
 */
export async function createSelfCareGoals(
  userId: string,
  drafts: SelfCareGoalDraft[],
  localDate: string,
): Promise<SelfCareGoal[]> {
  if (drafts.length === 0) return [];

  const rows = drafts.map((draft) => {
    const normalizedTitle = normalizeSelfCareGoalTitle(draft.title);
    if (normalizedTitle == null) throw new Error('Enter a shorter to-do.');
    return {
      user_id: userId,
      title: normalizedTitle,
      icon: draft.icon,
      recurrence: draft.recurrence,
      scheduled_time: draft.scheduledTime,
    };
  });

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('self_care_goals')
    .insert(rows)
    .select(GOAL_COLUMNS);
  if (error != null) throw error;

  return (data ?? []).map((row) => mapGoal(row, new Set(), localDate));
}

export async function updateSelfCareGoal(
  userId: string,
  goalId: string,
  edit: SelfCareGoalDraft,
  localDate: string,
): Promise<SelfCareGoal> {
  const normalizedTitle = normalizeSelfCareGoalTitle(edit.title);
  if (normalizedTitle == null) throw new Error('Enter a shorter to-do.');

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('self_care_goals')
    .update({
      title: normalizedTitle,
      icon: edit.icon,
      recurrence: edit.recurrence,
      scheduled_time: edit.scheduledTime,
    })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select(GOAL_COLUMNS)
    .single();
  if (error != null) throw error;

  // The edit does not touch today's completion, so the row is read back with
  // whatever it already had rather than being reset to open. A failed read is
  // raised rather than taken for an empty one: the two are indistinguishable
  // here, and guessing empty would un-check a to-do the user already finished.
  const { data: completion, error: completionError } = await supabase
    .from('self_care_goal_completions')
    .select('goal_id')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .eq('local_date', localDate)
    .maybeSingle();
  if (completionError != null) throw completionError;

  return mapGoal(
    data,
    new Set(completion == null ? [] : [goalId]),
    localDate,
  );
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
