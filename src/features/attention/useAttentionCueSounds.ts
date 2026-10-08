import { useEffect, useRef } from 'react';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { attentionCueFor, type AttentionCue } from './domain/attentionCues';
import type { AttentionStep } from './domain/attentionScripts';

/** Plays the Marimba Breeze cue for each step as it starts. */
export function useAttentionCueSounds(stepKey: number, step: AttentionStep | null, active: boolean) {
  const cue = attentionCueFor(step);
  // Leaving a step cancels its cue even if the sound is still loading.
  const players: Record<AttentionCue, () => void> = {
    squeeze: useCompletionSound('attentionSqueeze', { active: active && cue === 'squeeze' }),
    release: useCompletionSound('attentionRelease', { active: active && cue === 'release' }),
    sense5: useCompletionSound('attentionSense5', { active: active && cue === 'sense5' }),
    sense4: useCompletionSound('attentionSense4', { active: active && cue === 'sense4' }),
    sense3: useCompletionSound('attentionSense3', { active: active && cue === 'sense3' }),
    sense2: useCompletionSound('attentionSense2', { active: active && cue === 'sense2' }),
    sense1: useCompletionSound('attentionSense1', { active: active && cue === 'sense1' }),
  };
  const playersRef = useRef(players);
  playersRef.current = players;
  // Cues mark a step starting, so opening the screen mid-step stays silent.
  const lastStep = useRef(stepKey);

  useEffect(() => {
    if (lastStep.current === stepKey) return;
    lastStep.current = stepKey;
    if (!active) return;
    const cue = attentionCueFor(step);
    if (cue != null) playersRef.current[cue]();
    // The step is read for the key it belongs to; only a new key is a new step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, active]);
}
