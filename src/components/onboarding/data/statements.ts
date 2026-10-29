import type { OnboardingStep } from '../types';

/** The first-person line each cleaning-personality step asks them to agree with. */
export const CLEANING_STATEMENTS = {
  statementShutDown: 'I walk into a room and my brain just shuts down. I can’t find a starting point.',
  statementDoomPile: 'I have a “doom pile”: a chair, counter, or corner where things land and never leave.',
  statementGaveUp: 'There’s a room or closet I’ve basically given up on. I just leave it alone.',
  statementAvoidGuests: 'I avoid having people over because of how my place looks, even close friends.',
  statementAvoidCleaning: 'I tend to avoid cleaning until it’s truly necessary.',
  statementSelfBlame: 'When my place is a mess, I call myself lazy or a slob.',
} satisfies Partial<Record<OnboardingStep, string>>;

export type CleaningStatementStep = keyof typeof CLEANING_STATEMENTS;

export function isCleaningStatementStep(step: OnboardingStep): step is CleaningStatementStep {
  return step in CLEANING_STATEMENTS;
}

/** The statements queued behind this one, so the deck can show them stacked underneath. */
export function upcomingStatements(
  steps: readonly OnboardingStep[],
  current: OnboardingStep,
): string[] {
  const upcoming: string[] = [];
  for (let index = steps.indexOf(current) + 1; index < steps.length; index++) {
    const step = steps[index];
    if (!isCleaningStatementStep(step)) break;
    upcoming.push(CLEANING_STATEMENTS[step]);
  }
  return upcoming;
}
