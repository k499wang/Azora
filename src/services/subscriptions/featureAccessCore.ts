export const FeatureKey = {
  HeartRateMeasurement: 'heart_rate_measurement',
  BreathingHeartRateMonitoring: 'breathing_heart_rate_monitoring',
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

const FREE_DAILY_LIMITS: Partial<Record<FeatureKeyValue, number>> = {
  [FeatureKey.HeartRateMeasurement]: 1,
  [FeatureKey.DailyExercise]: 1,
};

const PRO_ONLY_FEATURES = new Set<FeatureKeyValue>([
  FeatureKey.AdvancedStats,
  FeatureKey.BreathingHeartRateMonitoring,
  FeatureKey.SessionHistory,
]);

export function getLocalDate(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

  if (PRO_ONLY_FEATURES.has(input.feature)) {
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
