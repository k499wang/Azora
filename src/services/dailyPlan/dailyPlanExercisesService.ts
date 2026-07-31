import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import {
  sanitizeDailyPlanExercises,
  type DailyPlanExercises,
} from '../../features/exercise/guidedBreathing/domain/dailyExercisePlan';

interface DailyPlanExercisesDatabase {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          user_id: string;
          daily_plan_exercises: unknown | null;
        };
        Insert: {
          user_id: string;
          daily_plan_exercises?: unknown | null;
        };
        Update: {
          user_id?: string;
          daily_plan_exercises?: unknown | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type UserPreferencesInsert =
  DailyPlanExercisesDatabase['public']['Tables']['user_preferences']['Insert'];

function getDailyPlanExercisesClient(): SupabaseClientLike<DailyPlanExercisesDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<
    DailyPlanExercisesDatabase
  >;
}

export async function getDailyPlanExercises(
  userId: string,
): Promise<DailyPlanExercises | null> {
  const supabase = getDailyPlanExercisesClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('user_id, daily_plan_exercises')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) throw error;

  return sanitizeDailyPlanExercises(data?.daily_plan_exercises);
}

export async function updateDailyPlanExercises(
  userId: string,
  plan: DailyPlanExercises,
): Promise<DailyPlanExercises> {
  const next = sanitizeDailyPlanExercises(plan);
  if (next == null) {
    throw new Error('Cannot persist an invalid daily exercise plan.');
  }

  const supabase = getDailyPlanExercisesClient();
  const payload: UserPreferencesInsert = {
    user_id: userId,
    daily_plan_exercises: next,
  };
  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' });

  if (error != null) throw error;

  return next;
}
