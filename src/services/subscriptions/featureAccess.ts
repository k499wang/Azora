import { requireSupabaseClient } from '../supabase/index';
import type { Database } from '../supabase/database.types';
import { getLocalDate, type DailyFeatureUsage } from './featureAccessCore';

export {
  FeatureKey,
  getFeatureAccess,
  getLocalDate,
} from './featureAccessCore';
export type {
  DailyFeatureUsage,
  FeatureAccessResult,
  FeatureKeyValue,
} from './featureAccessCore';

type DailyActivityRow = Database['public']['Tables']['daily_activity']['Row'];

export async function getDailyFeatureUsage(
  userId: string,
  localDate = getLocalDate(),
): Promise<DailyFeatureUsage> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('daily_activity')
    .select('activity_date, breath_hold_count, breathing_session_count, heart_rate_capture_count')
    .eq('user_id', userId)
    .eq('activity_date', localDate)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  const row = data as DailyActivityRow | null;

  return {
    localDate,
    breathHoldCount: row?.breath_hold_count ?? 0,
    breathingSessionCount: row?.breathing_session_count ?? 0,
    heartRateCaptureCount: row?.heart_rate_capture_count ?? 0,
  };
}
