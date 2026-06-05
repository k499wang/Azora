/**
 * Pure geometry + outcome math for the discount spin wheel.
 *
 * This module has no React Native / Skia / theme dependencies so the
 * landing math stays unit-testable in plain node. The view layer
 * (`DiscountWheel.tsx`) renders and animates; this file only decides
 * angles and where the wheel must stop.
 *
 * Angle conventions:
 * - All angles are degrees.
 * - The pointer is fixed at the top of the wheel (12 o'clock).
 * - Segment angles are measured *clockwise from the top* so that
 *   segment 0 starts at the pointer. This is independent of the Skia
 *   drawing offset (Skia's 0deg is at 3 o'clock); the view applies that
 *   offset separately when it draws.
 */

const FULL_CIRCLE = 360;

export interface WheelSegment {
  /** Stable identity used to pick the rigged winner. */
  id: string;
  /** Short display text, e.g. "50% OFF". */
  label: string;
}

/** Degrees occupied by a single segment. */
export function segmentSweepAngle(segmentCount: number): number {
  if (segmentCount <= 0) {
    throw new Error('segmentCount must be positive');
  }
  return FULL_CIRCLE / segmentCount;
}

/** Center of a segment, clockwise from the top pointer. */
export function segmentCenterAngle(index: number, segmentCount: number): number {
  return (index + 0.5) * segmentSweepAngle(segmentCount);
}

export interface TargetRotationInput {
  /** Index of the segment we want to land on (the rigged outcome). */
  winningIndex: number;
  segmentCount: number;
  /** Current absolute rotation of the wheel, in degrees. */
  currentRotation: number;
  /** Whole turns to spin before settling, for the "spin" feel. */
  fullTurns?: number;
  /**
   * Where inside the winning wedge to stop, in [-1, 1].
   * 0 = dead center, ±1 = wedge edge. Adds realism so the wheel
   * doesn't always halt at the exact center. Stays within the wedge.
   */
  landingOffset?: number;
}

/**
 * Absolute rotation (degrees) to animate the wheel to so that
 * `winningIndex` ends up under the top pointer. Always resolves to a
 * value greater than `currentRotation` so the wheel only ever spins
 * forward, including on repeat spins.
 */
export function resolveTargetRotation({
  winningIndex,
  segmentCount,
  currentRotation,
  fullTurns = 5,
  landingOffset = 0,
}: TargetRotationInput): number {
  const sweep = segmentSweepAngle(segmentCount);
  const center = segmentCenterAngle(winningIndex, segmentCount);
  const jitter = clamp(landingOffset, -1, 1) * (sweep / 2);

  // Rotation R lands `center` under the pointer when (center + R) ≡ 0,
  // i.e. R ≡ -center (mod 360). The jitter nudges within the wedge.
  const settleAngle = mod(FULL_CIRCLE - center + jitter, FULL_CIRCLE);
  const normalized = mod(currentRotation, FULL_CIRCLE);
  const forward = mod(settleAngle - normalized, FULL_CIRCLE);

  return currentRotation + fullTurns * FULL_CIRCLE + forward;
}

/**
 * Inverse of {@link resolveTargetRotation}: which segment sits under the
 * pointer at a given rotation. Used in tests to verify landings.
 */
export function segmentIndexAtPointer(
  rotation: number,
  segmentCount: number,
): number {
  const sweep = segmentSweepAngle(segmentCount);
  const localAngle = mod(-rotation, FULL_CIRCLE);
  return Math.floor(localAngle / sweep) % segmentCount;
}

/** Pick a random landing offset in (-maxFraction, maxFraction). */
export function randomLandingOffset(maxFraction = 0.6): number {
  return (Math.random() * 2 - 1) * clamp(maxFraction, 0, 1);
}

export interface DiscountSegments {
  segments: WheelSegment[];
  /** Segment the wheel must land on — the real discount being offered. */
  winningId: string;
}

const MIN_DISCOUNT = 5;
const MAX_DISCOUNT = 90;

/**
 * Build the wheel's segments around the real discount being offered.
 *
 * The real percent is always present and is the rigged winner. Decoys are
 * laddered above and below it (alternating) so the wheel reads as a genuine
 * mix rather than the prize sitting at one extreme. Slot order is purely
 * presentational — the landing is decided by `winningId`, not position.
 */
export function buildDiscountSegments(
  realPercent: number,
  { count = 6, step = 10 }: { count?: number; step?: number } = {},
): DiscountSegments {
  const real = clamp(Math.round(realPercent), MIN_DISCOUNT, MAX_DISCOUNT);
  const values: number[] = [real];

  let below = real - step;
  let above = real + step;
  let preferBelow = true;
  while (values.length < count && (below >= MIN_DISCOUNT || above <= MAX_DISCOUNT)) {
    const canBelow = below >= MIN_DISCOUNT;
    const canAbove = above <= MAX_DISCOUNT;
    if (preferBelow ? canBelow : !canAbove && canBelow) {
      values.push(below);
      below -= step;
    } else if (canAbove) {
      values.push(above);
      above += step;
    }
    preferBelow = !preferBelow;
  }

  const segments = values.map((percent) => ({
    id: `pct-${percent}`,
    label: `${percent}% OFF`,
  }));

  return { segments, winningId: `pct-${real}` };
}

function mod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
