import { getTechnique } from '../../features/exercise/guidedBreathing/techniques';
import type { TechniqueId } from '../../features/exercise/guidedBreathing/techniqueCatalog';
import type { InsightContext } from './index';

/**
 * A recommendation rule. Evaluated top-to-bottom; the first rule whose
 * `match(ctx)` returns true wins, so order is the priority order — put
 * narrower conditions above broader ones.
 *
 * To add a new rule:
 *   1. Insert an entry into RECOMMENDATION_RULES below, at the priority you
 *      want it evaluated.
 *   2. Point `techniqueId` at any id in `techniqueCatalog.ts` — a typo is a
 *      compile error rather than a silent fall back to the first exercise.
 *   3. Write a short `reason` explaining the *why*; it is shown to the user
 *      after "Try X — ".
 *
 * To add a new exercise, see `techniques.ts`. It becomes selectable here by id
 * with no further changes.
 *
 * Fixed, non-conditional suggestions (moods, onboarding goals, home shortcuts)
 * are lookups rather than rules and live in
 * `src/features/exercise/guidedBreathing/techniqueSelection.ts`.
 */
export interface RecommendationRule {
  id: string;
  match: (ctx: InsightContext) => boolean;
  techniqueId: TechniqueId;
  reason: string;
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    id: 'acute-stress',
    match: ({ stress }) => stress != null && stress > 85,
    techniqueId: 'extended-exhale',
    reason:
      'your stress is running high, and an exhale twice the length of the inhale brings it down fastest',
  },
  {
    id: 'high-stress',
    match: ({ stress }) => stress != null && stress > 66,
    techniqueId: '478',
    reason:
      'your stress is elevated — the extended exhale calms the nervous system quickly',
  },
  {
    id: 'hrv-below-baseline',
    match: ({ rmssd, avgRmssd }) =>
      rmssd != null && avgRmssd != null && avgRmssd > 0 && rmssd < avgRmssd * 0.85,
    techniqueId: 'extended-exhale',
    reason: 'your HRV is below baseline — extended exhales rebuild vagal tone',
  },
  {
    id: 'moderate-stress',
    match: ({ stress }) => stress != null && stress > 33,
    techniqueId: 'resonance',
    reason: "coherent breathing maximizes HRV when you're in a balanced state",
  },
  {
    id: 'strong-recovery',
    match: ({ hrDrop }) => hrDrop != null && hrDrop >= 12,
    techniqueId: 'box',
    reason: 'strong recovery today — box breathing builds focus on top of it',
  },
  {
    id: 'calm-and-recovered',
    match: ({ stress }) => stress != null && stress <= 33,
    techniqueId: 'wimhof',
    reason: "you're calm and recovered — channel that into energy",
  },
];

export const DEFAULT_RECOMMENDATION: { techniqueId: TechniqueId; reason: string } = {
  techniqueId: 'resonance',
  reason: 'a balanced session to maintain your baseline',
};

export interface ResolvedRecommendation {
  ruleId: string;
  techniqueId: TechniqueId;
  techniqueName: string;
  duration: string;
  reason: string;
}

export function pickRecommendation(
  ctx: InsightContext,
): ResolvedRecommendation | null {
  const fallback = {
    ruleId: 'default',
    techniqueId: DEFAULT_RECOMMENDATION.techniqueId,
    reason: DEFAULT_RECOMMENDATION.reason,
  };

  const rule = RECOMMENDATION_RULES.find((r) => r.match(ctx));
  const chosen = rule
    ? { ruleId: rule.id, techniqueId: rule.techniqueId, reason: rule.reason }
    : fallback;

  const technique = getTechnique(chosen.techniqueId);
  if (!technique) return null;

  return {
    ruleId: chosen.ruleId,
    techniqueId: technique.id,
    techniqueName: technique.name,
    duration: technique.duration,
    reason: chosen.reason,
  };
}
