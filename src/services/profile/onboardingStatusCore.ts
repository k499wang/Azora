export interface RecoverableOnboardingProfileFields {
  onboarding_profile_saved_at: string | null;
  onboarding_goal: string | null;
  age: number | null;
  gender: string | null;
  daily_minutes: number | null;
}

export function hasRecoverableOnboardingProfile(
  data: RecoverableOnboardingProfileFields,
): boolean {
  if (data.onboarding_profile_saved_at != null) {
    return true;
  }

  // Before the explicit marker existed, onboarding required a goal before it
  // could save, while the remaining profile answers could be skipped.
  return data.onboarding_goal != null && data.onboarding_goal.trim().length > 0;
}
