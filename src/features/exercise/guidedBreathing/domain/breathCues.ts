import type { BreathingTechnique } from '../techniques';

const CUES = {
  inhale: { long: 'breathInhale', twoSecond: 'breathInhale2s', oneSecond: 'breathInhale1s' },
  exhale: { long: 'breathExhale', twoSecond: 'breathExhale2s', oneSecond: 'breathExhale1s' },
} as const;

type Breath = keyof typeof CUES;
export type BreathCueSound = (typeof CUES)[Breath][keyof (typeof CUES)[Breath]];

// Each length's cue ends before a phase that short does, so a fast round never
// stacks one breath's sound onto the next.
function cueFor(breath: Breath, seconds: number): BreathCueSound {
  if (seconds >= 3) return CUES[breath].long;
  return seconds >= 2 ? CUES[breath].twoSecond : CUES[breath].oneSecond;
}

export function breathCueSounds(pattern: BreathingTechnique['pattern']) {
  return {
    inhale: cueFor('inhale', pattern.inhale),
    exhale: cueFor('exhale', pattern.exhale),
  };
}
