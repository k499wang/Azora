import type { MindMapResult, MindMapScore } from './onboardingScores';

export interface PaywallPersonalizationInput {
  displayName: string | null;
  dailyMinutes: number | null;
  baselineBpm: number | null;
  mindMap: MindMapResult | null;
}

export interface PaywallPersonalization {
  displayName: string | null;
  dailyMinutes: number;
  baselineBpm: number | null;
  currentScores: MindMapScore[] | null;
  targetScores: MindMapScore[] | null;
  superpower: MindMapScore | null;
  growthArea: MindMapScore | null;
}

export function buildPaywallPersonalization(
  input: PaywallPersonalizationInput,
): PaywallPersonalization {
  const currentScores = input.mindMap?.scores ?? null;
  return {
    displayName: input.displayName,
    dailyMinutes: clampMinutes(input.dailyMinutes),
    baselineBpm: clampBpm(input.baselineBpm),
    currentScores,
    targetScores: currentScores ? currentScores.map(toTarget) : null,
    superpower: input.mindMap?.superpower ?? null,
    growthArea: input.mindMap?.growthArea ?? null,
  };
}

function toTarget(score: MindMapScore): MindMapScore {
  const bump =
    score.value <= 40 ? 25 : score.value <= 60 ? 18 : score.value <= 80 ? 12 : 6;
  return { ...score, value: Math.min(100, score.value + bump) };
}

function clampMinutes(value: number | null): number {
  if (value == null || Number.isNaN(value)) return 5;
  return Math.max(1, Math.min(60, Math.round(value)));
}

function clampBpm(value: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value < 30 || value > 220) return null;
  return Math.round(value);
}
