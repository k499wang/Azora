import { Easing } from 'react-native-reanimated';

/**
 * One place to tune how the app moves.
 *
 * Durations, curves and spring configs were previously written inline at each
 * call site — a 380 here, a 420 there, three different ease-outs — so nothing
 * was quite in sync and changing the feel meant hunting through files. Reach
 * for these instead of a number.
 */

export const duration = {
  /** state flips: a chip selecting, a colour changing */
  fast: 180,
  /** the default for anything entering or leaving */
  base: 260,
  /** content arriving on a screen */
  slow: 420,
  /** a burst or bloom playing itself out */
  slower: 640,
  /** a bar filling — long enough to be watched */
  fill: 900,
} as const;

export const easing = {
  /** arriving: fast off the mark, gentle landing */
  enter: Easing.out(Easing.cubic),
  /** leaving: slow to commit, then gone */
  exit: Easing.in(Easing.cubic),
  /** falling under gravity */
  gravity: Easing.in(Easing.cubic),
  /** a long flat deceleration — covers the distance early, settles softly */
  settle: Easing.bezier(0.16, 1, 0.3, 1),
  /** particles and glows thinning out */
  burst: Easing.out(Easing.quad),
} as const;

export const spring = {
  /** a small overshoot — for things appearing */
  pop: { damping: 11, stiffness: 160, mass: 0.8 },
  /** a sharper rebound — for impacts */
  bounce: { damping: 8, stiffness: 190, mass: 0.7 },
  /** no overshoot worth seeing — for returning to rest */
  settle: { damping: 18, stiffness: 180 },
} as const;

/** gaps between items in a staggered entrance */
export const stagger = {
  tight: 60,
  base: 90,
  loose: 115,
} as const;

/** how far something travels as it fades in, in points */
export const travel = {
  rise: 16,
  drop: 22,
} as const;
