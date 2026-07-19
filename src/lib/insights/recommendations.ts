import TECHNIQUES from '../../features/exercise/guidedBreathing/techniques';
import type { InsightContext } from './index';

/**
 * A recommendation rule. Evaluated top-to-bottom; the first rule whose
 * `match(ctx)` returns true wins.
 *
 * To add a new rule:
 *   1. Push an entry onto RECOMMENDATION_RULES below.
 *   2. Point `techniqueId` at any id in the guided breathing technique catalog.
 *   3. (Optional) write a short `reason` string explaining the *why*.
 *
 * To add a new technique:
 *   - Add it to src/features/exercise/guidedBreathing/techniques.ts. It will automatically be
 *     selectable here by id with no further changes.
 */
export interface RecommendationRule {
  id: string;
  match: (ctx: InsightContext) => boolean;
  techniqueId: string;
  reason: string;
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
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
    techniqueId: 'relaxing',
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

export const DEFAULT_RECOMMENDATION: { techniqueId: string; reason: string } = {
  techniqueId: 'resonance',
  reason: 'a balanced session to maintain your baseline',
};

export interface ResolvedRecommendation {
  ruleId: string;
  techniqueId: string;
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

  const technique = TECHNIQUES.find((t) => t.id === chosen.techniqueId);
  if (!technique) return null;

  return {
    ruleId: chosen.ruleId,
    techniqueId: technique.id,
    techniqueName: technique.name,
    duration: technique.duration,
    reason: chosen.reason,
  };
}
