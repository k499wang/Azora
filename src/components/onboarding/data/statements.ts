import type { OnboardingStep } from '../types';

/** The first-person line each agree-or-disagree step asks about. */
export const ONBOARDING_STATEMENTS = {
  fallingBehind: 'I always feel like I’m falling behind.',
  skipSelfCare: 'Self-care is the first thing I drop when life gets busy.',
  drainedFrequency: 'Most days, I feel mentally or physically drained.',
  unhealthyRoutines: 'I find myself stuck in unhealthy routines that are hard to break.',
  overwhelmedStart: 'I get anxious when I have too much to do and don’t know where to begin.',
  avoidTasks: 'I tend to avoid tasks until they’re absolutely necessary.',
  endOfDayRegret: 'At the end of the day, I often regret not getting more done.',
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
