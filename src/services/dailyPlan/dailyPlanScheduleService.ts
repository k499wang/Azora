import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import { sanitizeDailyPlanSchedule } from './dailyPlanScheduleCore';
import type { DailyPlanSchedule } from './types';

export { sanitizeDailyPlanSchedule };
export { DEFAULT_DAILY_PLAN_SCHEDULE } from './types';

interface DailyPlanScheduleDatabase {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          user_id: string;
          daily_plan_schedule: unknown | null;
        };
        Insert: {
          user_id: string;
          daily_plan_schedule?: unknown | null;
        };
        Update: {
          user_id?: string;
          daily_plan_schedule?: unknown | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type UserPreferencesInsert =
  DailyPlanScheduleDatabase['public']['Tables']['user_preferences']['Insert'];

function getDailyPlanScheduleClient(): SupabaseClientLike<DailyPlanScheduleDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<
    DailyPlanScheduleDatabase
  >;
}

export async function getDailyPlanSchedule(
  userId: string,
): Promise<DailyPlanSchedule> {
  const supabase = getDailyPlanScheduleClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('user_id, daily_plan_schedule')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return sanitizeDailyPlanSchedule(data?.daily_plan_schedule);
}

export async function updateDailyPlanSchedule(
  userId: string,
  schedule: DailyPlanSchedule,
): Promise<DailyPlanSchedule> {
  const next = sanitizeDailyPlanSchedule(schedule);
  const supabase = getDailyPlanScheduleClient();
  const payload: UserPreferencesInsert = {
    user_id: userId,
    daily_plan_schedule: next,
  };
  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' });

  if (error != null) {
    throw error;
  }

  return next;
}
