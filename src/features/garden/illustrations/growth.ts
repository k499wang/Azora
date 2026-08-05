/**
 * Growth math shared by every flower species renderer.
 *
 * The plug-in contract is deliberately simple: a species receives a `growth`
 * scalar in [0, 1] and decides how to draw itself. Today that scalar is derived
 * from garden care days; tomorrow it may come from per-flower events or a
 * randomized gamification roll — only this file (and the call sites) change.
 */

const MATURE_AT_CARE_DAYS = 30;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - clamp01(value), 3);
}

/**
 * Maps garden care days to a raw growth scalar in [0, 1]. The raw value is
 * intentionally NOT eased — each species eases it however it likes so every
 * illustration can present the same underlying growth differently.
 */
export function flowerGrowthFromCareDays(careDays: number): number {
  return clamp01(careDays / MATURE_AT_CARE_DAYS);
}
