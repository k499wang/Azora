export const PaywallPlacement = {
  OnboardingComplete: 'onboarding_complete',
  ProfileUpgrade: 'profile_upgrade',
  HeartRateProGate: 'heart_rate_pro_gate',
  DailyResultProGate: 'daily_result_pro_gate',
  ExercisePremiumGate: 'exercise_premium_gate',
  RoutinePresetProGate: 'routine_preset_pro_gate',
  PlanWeekProGate: 'plan_week_pro_gate',
  ExitDiscount: 'exit_discount',
} as const;

export type PaywallPlacementValue =
  typeof PaywallPlacement[keyof typeof PaywallPlacement];
