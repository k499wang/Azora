import type { MindMapScore } from './onboardingScores';

const LOW_BAND_MAX = 40;
const BUILDING_BAND_MAX = 60;
const STRENGTHENING_BAND_MAX = 80;
/** The projected shape stops short of the radar's edge, so the aim never reads as perfect. */
const PROJECTED_MAX = 96;

/** Where each axis should sit once the plan has been followed. */
export function projectScores(scores: MindMapScore[]): MindMapScore[] {
  return scores.map((score) => {
    const bump =
      score.value <= LOW_BAND_MAX
        ? 60
        : score.value <= BUILDING_BAND_MAX
          ? 35
          : score.value <= STRENGTHENING_BAND_MAX
            ? 25
            : 15;
    return { ...score, value: Math.max(score.value, Math.min(PROJECTED_MAX, score.value + bump)) };
  });
}

/** What the plan does for an axis, in the same bands that set its projected gain. */
export function planChangeLabel(value: number): string {
  if (value <= BUILDING_BAND_MAX) return 'Building up';
  if (value <= STRENGTHENING_BAND_MAX) return 'Strengthening';
  return 'Keeping it up';
}
