import type { MindMapScore } from './onboardingScores';

const LOW_BAND_MAX = 40;
const BUILDING_BAND_MAX = 60;
const STRENGTHENING_BAND_MAX = 80;

/** Where each axis should sit once the plan has been followed. */
export function projectScores(scores: MindMapScore[]): MindMapScore[] {
  return scores.map((score) => {
    const bump =
      score.value <= LOW_BAND_MAX
        ? 35
        : score.value <= BUILDING_BAND_MAX
          ? 28
          : score.value <= STRENGTHENING_BAND_MAX
            ? 20
            : 10;
    return { ...score, value: Math.min(100, score.value + bump) };
  });
}

/** What the plan does for an axis, in the same bands that set its projected gain. */
export function planChangeLabel(value: number): string {
  if (value <= BUILDING_BAND_MAX) return 'Building up';
  if (value <= STRENGTHENING_BAND_MAX) return 'Strengthening';
  return 'Keeping it up';
}
