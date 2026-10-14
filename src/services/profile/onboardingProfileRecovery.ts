// `onboarding_goal` is only ever written by saveOnboardingProfile, which the
// flow calls once at the final pact step and skips entirely when the goal is
// empty. The flow writes it after required setup succeeds, so a non-empty goal
// marks a profile ready to resume at the paywall. It is the only field safe to
// gate on: age/gender/daily_minutes are all skippable,
// so requiring them stranded skippers back at step one on the next launch.
export function hasRecoverableOnboardingProfile(data: {
  onboarding_goal: string | null;
}): boolean {
  return data.onboarding_goal != null && data.onboarding_goal.length > 0;
}
