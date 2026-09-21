import { requireSupabaseClient } from '../supabase';

/** Development-only reset for repeatedly rehearsing the first-routine-todo flow. */
export async function resetRoutineFirstTodoDevState(
  userId: string,
  localDate: string,
): Promise<void> {
  if (!__DEV__) return;

  const supabase = requireSupabaseClient();
  const { error } = await supabase
    .from('self_care_goal_completions')
    .delete()
    .eq('user_id', userId)
    .eq('local_date', localDate);
  if (error != null) throw error;

}
