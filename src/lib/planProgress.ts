/**
 * Reading a plan's position, and recovering which plan someone was given.
 *
 * Position itself is built from the enrollment — see `usePlanPosition` — because
 * the plan advances on completion and only the enrollment knows how far that
 * has got. What lives here is the shape both screens read, and the resolution of
 * a stored goal string back into the goals it was written from.
 */

import {
  isOnboardingIntent,
  type OnboardingIntent,
} from '../features/exercise/guidedBreathing/techniqueSelection';
import type { PlanPhaseBound } from './onboardingPreset';
import type { ProgramPlanId } from '../features/program/domain/programCatalogue';

const DAYS_PER_WEEK = 7;

/**
 * The goal as it is stored, which is the goals' *titles* joined with commas —
 * see `buildOnboardingGoal`. Nothing stores the ids, so the titles are the only
 * record of what the user picked, and the plan is resolved back out of them.
 *
 * `titlesToIntent` is supplied by the caller rather than imported so this stays
 * a pure module: the titles live in onboarding's option data, which pulls in
 * colors, icons and screens that have no business being loaded to answer which
 * week it is.
 */
export function resolvePlanIntents(
  onboardingGoal: string | null | undefined,
  titlesToIntent: ReadonlyMap<string, OnboardingIntent>,
): OnboardingIntent[] {
  if (onboardingGoal == null) return [];

  const intents: OnboardingIntent[] = [];
  for (const part of onboardingGoal.split(',')) {
    const intent = titlesToIntent.get(part.trim().toLocaleLowerCase());
    if (intent != null && !intents.includes(intent)) intents.push(intent);
  }
  return intents;
}

export function resolvePlanIntent(
  onboardingGoal: string | null | undefined,
  titlesToIntent: ReadonlyMap<string, OnboardingIntent>,
): OnboardingIntent {
  // The first is the one they ranked first, which is the one the plan was built
  // around — `primaryIntent` reads the list the same way. A goal written by a
  // build whose titles have since changed still gets a plan; it gets the
  // broadest one rather than no plan at all.
  return resolvePlanIntents(onboardingGoal, titlesToIntent)[0] ?? 'other';
}

/** Builds the lookup `resolvePlanIntent` needs from onboarding's option data. */
export function buildIntentTitleLookup(
  options: readonly { id: string; title: string }[],
): ReadonlyMap<string, OnboardingIntent> {
  const lookup = new Map<string, OnboardingIntent>();
  for (const option of options) {
    if (isOnboardingIntent(option.id)) {
      lookup.set(option.title.toLocaleLowerCase(), option.id);
    }
  }
  return lookup;
}

export interface PlanPosition {
  planId: ProgramPlanId;
  /** `The Azora Protocol` — the same for every plan. See `PROGRAM_NAME`. */
  planName: string;
  phase: PlanPhaseBound;
  /** 1-based, and never past the last week of the plan. */
  week: number;
  totalWeeks: number;
  /** Days completed, which is what the week is counted from. */
  daysDone: number;
  /** Every day of the plan is done. */
  isFinished: boolean;
}

/**
 * `Week 2 of 4`, the line that sits under the plan's name.
 *
 * The phase is named on the plan's own screen, beside the rung it belongs to,
 * where there is room to say what it sets up. Here it would be a second name
 * competing with the plan's, so this is the position and nothing else.
 */
export function planPositionLabel(position: PlanPosition): string {
  if (position.isFinished) return 'Every week done';
  return `Week ${position.week} of ${position.totalWeeks}`;
}

/** How far through the whole plan they are, 0–1, for a progress track. */
export function planCompletionRatio(position: PlanPosition): number {
  const total = position.totalWeeks * DAYS_PER_WEEK;
  return Math.min(position.daysDone / total, 1);
}
