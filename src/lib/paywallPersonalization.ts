import type { MindMapScore } from './onboardingScores';

/** Where each axis should sit once the plan has been followed. */
export function projectScores(scores: MindMapScore[]): MindMapScore[] {
  return scores.map((score) => {
    const bump =
      score.value <= 40 ? 35 : score.value <= 60 ? 28 : score.value <= 80 ? 20 : 10;
    return { ...score, value: Math.min(100, score.value + bump) };
  });
}
