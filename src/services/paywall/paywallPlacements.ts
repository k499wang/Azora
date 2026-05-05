export const PaywallPlacement = {
  OnboardingComplete: 'onboarding_complete',
  ProfileUpgrade: 'profile_upgrade',
  HeartRateProGate: 'heart_rate_pro_gate',
  DailyResultProGate: 'daily_result_pro_gate',
  ExercisePremiumGate: 'exercise_premium_gate',
} as const;

export type PaywallPlacementValue =
  typeof PaywallPlacement[keyof typeof PaywallPlacement];
