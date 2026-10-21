import type { MindMapAxis, MindMapScore } from './onboardingScores';

const BUILDING_BAND_MAX = 60;
const STRENGTHENING_BAND_MAX = 80;
const PROJECTED_MAX = 94;
// Illustrative chart targets; these are not measured or validated outcomes.
const ILLUSTRATIVE_GROWTH_SHARE: Record<MindMapAxis, number> = {
  calm: 0.95,
  recovery: 0.62,
  focus: 0.82,
  mood: 0.72,
  vitality: 0.9,
};

/** Illustrates growth from the assessment while retaining its starting differences. */
export function projectScores(scores: MindMapScore[]): MindMapScore[] {
  return scores.map((score) => {
    const roomToGrow = Math.max(0, PROJECTED_MAX - score.value);
    const growth = Math.round(roomToGrow * ILLUSTRATIVE_GROWTH_SHARE[score.axis]);
    return { ...score, value: score.value + growth };
  });
}

/** What the plan does for an axis based on its current score. */
export function planChangeLabel(value: number): string {
  if (value <= BUILDING_BAND_MAX) return 'Building up';
  if (value <= STRENGTHENING_BAND_MAX) return 'Strengthening';
  return 'Keeping it up';
}
