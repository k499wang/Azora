import { requireSupabaseClient } from '../supabase';
import type { Database } from '../supabase/database.types';

export const FeatureKey = {
  HeartRateMeasurement: 'heart_rate_measurement',
  DailyExercise: 'daily_exercise',
  AdvancedStats: 'advanced_stats',
  SessionHistory: 'session_history',
} as const;

export type FeatureKeyValue = typeof FeatureKey[keyof typeof FeatureKey];

export interface DailyFeatureUsage {
  localDate: string;
  breathHoldCount: number;
  breathingSessionCount: number;
  heartRateCaptureCount: number;
}

export interface FeatureAccessResult {
  allowed: boolean;
  isPro: boolean;
  reason: 'pro' | 'within_free_limit' | 'free_limit_reached' | 'pro_only';
  used: number;
  limit: number | null;
}

type DailyActivityRow = Database['public']['Tables']['daily_activity']['Row'];

const FREE_DAILY_LIMITS: Partial<Record<FeatureKeyValue, number>> = {
  [FeatureKey.HeartRateMeasurement]: 1,
  [FeatureKey.DailyExercise]: 1,
};

export function getLocalDate(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

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

export function getFeatureAccess(input: {
  feature: FeatureKeyValue;
  isPro: boolean;
  usage?: DailyFeatureUsage | null;
}): FeatureAccessResult {
  if (input.isPro) {
    return {
      allowed: true,
      isPro: true,
      reason: 'pro',
      used: 0,
      limit: null,
    };
  }

  if (input.feature === FeatureKey.AdvancedStats || input.feature === FeatureKey.SessionHistory) {
    return {
      allowed: false,
      isPro: false,
      reason: 'pro_only',
      used: 0,
      limit: null,
    };
  }

  const limit = FREE_DAILY_LIMITS[input.feature] ?? null;
  const used = getUsedCount(input.feature, input.usage);

  if (limit == null || used < limit) {
    return {
      allowed: true,
      isPro: false,
      reason: 'within_free_limit',
      used,
      limit,
    };
  }

  return {
    allowed: false,
    isPro: false,
    reason: 'free_limit_reached',
    used,
    limit,
  };
}

function getUsedCount(
  feature: FeatureKeyValue,
  usage?: DailyFeatureUsage | null,
): number {
  if (usage == null) return 0;

  if (feature === FeatureKey.HeartRateMeasurement) {
    return usage.heartRateCaptureCount;
  }

  if (feature === FeatureKey.DailyExercise) {
    return usage.breathHoldCount + usage.breathingSessionCount;
  }

  return 0;
}
