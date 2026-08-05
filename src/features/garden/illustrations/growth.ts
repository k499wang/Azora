/**
 * Growth math shared by every flower species renderer.
 *
 * The plug-in contract is deliberately simple: a species receives a `growth`
 * scalar in [0, 1] and decides how to draw itself. Today that scalar is derived
 * from garden care days; tomorrow it may come from per-flower events or a
 * randomized gamification roll — only this file (and the call sites) change.
 *
 * Each species uses four hand-authored, discrete compositions (sprout → bud →
 * opening → bloom). The scalar only selects a composition; it never reshapes
 * petals or interpolates geometry.
 */

const MATURE_AT_CARE_DAYS = 30;

export type FlowerGrowthStage = 'sprout' | 'bud' | 'opening' | 'bloom';

/** Choose a complete illustrated stage; stages are intentionally discrete. */
export function flowerStageFromGrowth(growth: number): FlowerGrowthStage {
  const value = clamp01(growth);
  if (value < 0.25) return 'sprout';
  if (value < 0.5) return 'bud';
  if (value < 0.75) return 'opening';
  return 'bloom';
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - clamp01(value), 3);
}

/**
 * Maps garden care days to a raw growth scalar in [0, 1]. The raw value is
 * intentionally NOT eased so each species can choose its own discrete stage
 * thresholds.
 */
export function flowerGrowthFromCareDays(careDays: number): number {
  return clamp01(careDays / MATURE_AT_CARE_DAYS);
}
