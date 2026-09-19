/**
 * The plan we offer somebody who does not have one.
 *
 * Plans are started at the onboarding seal and nowhere else, so every account
 * that finished onboarding before plans existed has none and never will. The
 * offer is built from the goal they already gave us rather than from a second
 * questionnaire: they answered once, and asking again to unlock something they
 * did not know was missing is the part users punish in reviews.
 *
 * Resolution is the same path onboarding takes — `resolvePlanIntents` then
 * `onboardingPresetFor` — so a plan started from the plan screen and a plan
 * started at the seal are the same plan. Two routes to an enrollment must not
 * become two ways of choosing one.
 */

import {
  onboardingPresetFor,
  type OnboardingPreset,
} from '../../../lib/onboardingPreset';
import { resolvePlanIntents } from '../../../lib/planProgress';
import type { OnboardingIntent } from '../../exercise/guidedBreathing/techniqueSelection';

/**
 * What an unreadable goal gets. Says nothing about direction, so it resolves
 * to the broadest territory — the same fallback `resolvePlanIntent` uses.
 */
const FALLBACK_INTENT: OnboardingIntent = 'other';

export interface PlanStartOffer {
  planId: OnboardingPreset['id'];
  /** `The Azora Protocol` — the same for every plan. */
  planName: string;
  weeks: number;
  /**
   * True when their stored goal resolved to nothing and this is the broadest
   * plan rather than their own.
   *
   * The card says so out loud. A goal written by a build whose titles have
   * since changed still gets a plan — it just does not get told the plan was
   * built around something it was not.
   */
  isFallback: boolean;
}

export function planStartOffer(
  onboardingGoal: string | null | undefined,
  titlesToIntent: ReadonlyMap<string, OnboardingIntent>,
): PlanStartOffer {
  const intents = resolvePlanIntents(onboardingGoal, titlesToIntent);
  const preset = onboardingPresetFor(intents[0] ?? FALLBACK_INTENT);

  return {
    planId: preset.id,
    planName: preset.name,
    weeks: preset.weeks,
    isFallback: intents.length === 0,
  };
}

/**
 * How long the plan takes to "generate".
 *
 * The insert itself is one round trip and can land in under a second, which
 * for the one moment the whole feature turns on reads as nothing having
 * happened. Onboarding already holds its sealing screen open the same way, for
 * the same reason.
 *
 * The wait and the bar are pinned to this one number so the fill cannot finish
 * before the work does, or still be crawling after the screen has moved on.
 */
export const PLAN_GENERATING_MS = 2700;
