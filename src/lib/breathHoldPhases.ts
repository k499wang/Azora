export type DailyBreathHoldPhase =
  | 'idle'
  | 'intro'
  | 'placement'
  | 'preInhale'
  | 'preExhale'
  | 'inhale'
  | 'hold'
  | 'processingResults'
  | 'done';

export function isBreathHoldBreathingPhase(
  phase: DailyBreathHoldPhase,
): boolean {
  return phase === 'preInhale' || phase === 'preExhale' || phase === 'inhale';
}
