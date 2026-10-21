import type { MindMapAxis, MindMapScore } from './onboardingScores';

const BUILDING_BAND_MAX = 60;
const STRENGTHENING_BAND_MAX = 80;
const PROJECTED_MAX = 94;
const PROJECTED_AXIS_BOOST: Record<MindMapAxis, number> = {
  calm: 6,
  recovery: 0,
  focus: 3,
  mood: 2,
  vitality: 5,
};

/** Where each axis should sit once the plan has been followed. */
export function projectScores(scores: MindMapScore[]): MindMapScore[] {
  return scores.map((score) => {
    // Axis-specific boosts and ceilings keep equal inputs from forming a regular pentagon.
    const boost = PROJECTED_AXIS_BOOST[score.axis];
    const projectedValue = Math.round(72 + boost + score.value * 0.24);
    const ceiling = PROJECTED_MAX - 6 + boost;
    return { ...score, value: Math.max(score.value, Math.min(ceiling, projectedValue)) };
  });
}

/** What the plan does for an axis based on its current score. */
export function planChangeLabel(value: number): string {
  if (value <= BUILDING_BAND_MAX) return 'Building up';
  if (value <= STRENGTHENING_BAND_MAX) return 'Strengthening';
  return 'Keeping it up';
}
