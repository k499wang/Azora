import type { MindMapScore } from './onboardingScores';

const BUILDING_BAND_MAX = 60;
const STRENGTHENING_BAND_MAX = 80;
const PROJECTED_MAX = 94;

/** Where each axis should sit once the plan has been followed. */
export function projectScores(scores: MindMapScore[]): MindMapScore[] {
  return scores.map((score) => {
    // Keep variation between axes while leaving room at the radar's edge.
    const projectedValue = Math.round(72 + score.value * 0.24);
    return { ...score, value: Math.max(score.value, Math.min(PROJECTED_MAX, projectedValue)) };
  });
}

/** What the plan does for an axis based on its current score. */
export function planChangeLabel(value: number): string {
  if (value <= BUILDING_BAND_MAX) return 'Building up';
  if (value <= STRENGTHENING_BAND_MAX) return 'Strengthening';
  return 'Keeping it up';
}
