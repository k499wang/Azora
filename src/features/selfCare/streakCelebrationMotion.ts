/** One clock, in ms from activation, drives the flame, count, week row, and Continue. */
export const streakCelebrationMotion = {
  squashAt: 600,
  squashDuration: 200,
  igniteAt: 800,
  igniteDuration: 260,
  leapAt: 1060,
  leapDuration: 760,
  morphDuration: 120,
  landAt: 1820,
  puddleDuration: 160,
  shockDuration: 320,
  countDuration: 260,
  stretchAt: 2160,
  stretchDuration: 220,
  labelAt: 2400,
  labelDuration: 400,
  settleAt: 2700,
  settleDuration: 320,
  sparkDuration: 480,
  wobbleDuration: 500,
  idleLoop: 3200,
  idleFadeIn: 600,
  layerLag: 50,
  liftAt: 2700,
  liftDuration: 450,
  weekAt: 2850,
  copyAt: 2950,
  coinAt: 3250,
  coinFlipDuration: 520,
  extendAt: 3770,
  extendDuration: 140,
  dropAt: 3800,
  checkAt: 4000,
  mergeDuration: 120,
  checkPopDuration: 240,
  confettiDuration: 500,
  perfectAt: 4250,
  perfectDuration: 700,
  continueAt: 4300,
  continueDuration: 280,
  revealDuration: 300,
  end: 5000,
} as const;

/** Clamped 0→1 progress of `t` through the phase starting at `start`. */
export function phase(t: number, start: number, duration: number): number {
  'worklet';
  return Math.min(1, Math.max(0, (t - start) / duration));
}

export function mix(from: number, to: number, amount: number): number {
  'worklet';
  return from + (to - from) * amount;
}

// Plain equivalents of Reanimated's Easing curves, so the timeline stays a pure module.
export function easeInQuad(x: number): number {
  'worklet';
  return x * x;
}

export function easeOutCubic(x: number): number {
  'worklet';
  return 1 - (1 - x) ** 3;
}

export function easeInOutCubic(x: number): number {
  'worklet';
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
}

export function easeOutBack(x: number, overshoot: number): number {
  'worklet';
  return 1 + (overshoot + 1) * (x - 1) ** 3 + overshoot * (x - 1) ** 2;
}
