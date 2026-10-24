import type { OnboardingStep } from '../types';

/** The first-person line each agree-or-disagree step asks about. */
export const ONBOARDING_STATEMENTS = {
  fallingBehind: 'I always feel like I’m falling behind.',
  skipSelfCare: 'Self-care is the first thing I drop when life gets busy.',
  untappedPotential: 'I know I’m capable of more than I’m doing right now.',
  loseMotivation: 'I start strong, then my motivation fades.',
  scrollInstead: 'I end up scrolling instead of doing what I planned.',
  putOffGuilt: 'When I put something off, I feel guilty about it.',
} satisfies Partial<Record<OnboardingStep, string>>;

const STATEMENT_BY_STEP: Partial<Record<OnboardingStep, string>> = ONBOARDING_STATEMENTS;

/** The statements queued behind this one, so the deck can show them stacked underneath. */
export function upcomingStatements(
  steps: readonly OnboardingStep[],
  current: OnboardingStep,
): string[] {
  const upcoming: string[] = [];
  for (let index = steps.indexOf(current) + 1; index < steps.length; index++) {
    const statement = STATEMENT_BY_STEP[steps[index]];
    if (statement == null) break;
    upcoming.push(statement);
  }
  return upcoming;
}
