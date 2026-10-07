import { useEffect, useRef } from 'react';
import { useCompletionSound } from '../../../../hooks/useCompletionSound';
import type { GuidedBreathingPhase } from '../components/GuidedBreathingPresentation';
import { breathCueSounds } from '../domain/breathCues';
import type { BreathingTechnique } from '../techniques';

export function useBreathCueSounds(
  phase: GuidedBreathingPhase,
  pattern: BreathingTechnique['pattern'],
  active: boolean,
) {
  const sounds = breathCueSounds(pattern);
  const playInhale = useCompletionSound(sounds.inhale, { active });
  const playExhale = useCompletionSound(sounds.exhale, { active });
  const playHold = useCompletionSound('breathHold', { active });
  // Cues mark a phase starting, so resuming mid-phase stays silent.
  const lastPhase = useRef(phase);

  useEffect(() => {
    if (lastPhase.current === phase) return;
    lastPhase.current = phase;
    if (!active) return;
    if (phase === 'inhale') playInhale();
    else if (phase === 'exhale') playExhale();
    else if (phase === 'holdIn' || phase === 'holdOut') playHold();
  }, [phase, active, playInhale, playExhale, playHold]);
}
