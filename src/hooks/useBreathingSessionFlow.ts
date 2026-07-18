import { useCallback, useRef } from 'react';
import type { BreathingPhaseDurations } from '../lib/breathingSessionTiming';
import type { RunBreathingPhase } from './useBreathingPhaseRunner';

export interface BreathingSessionSequenceCompletion {
  pattern: BreathingPhaseDurations;
  totalRounds: number;
  elapsedSeconds: number;
}

interface UseBreathingSessionFlowOptions {
  isActive: () => boolean;
  runPhase: RunBreathingPhase;
  getElapsedSeconds: () => number;
  onRoundChange: (round: number) => void;
  onComplete: (completion: BreathingSessionSequenceCompletion) => void;
}

export function useBreathingSessionFlow({
  isActive,
  runPhase,
  getElapsedSeconds,
  onRoundChange,
  onComplete,
}: UseBreathingSessionFlowOptions) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  return useCallback(
    (pattern: BreathingPhaseDurations, totalRounds: number) => {
      let completionDelivered = false;

      const runRound = (currentRound: number) => {
        if (!isActive()) return;

        if (currentRound > totalRounds) {
          if (completionDelivered) return;
          completionDelivered = true;
          onCompleteRef.current({
            pattern,
            totalRounds,
            elapsedSeconds: getElapsedSeconds(),
          });
          return;
        }

        onRoundChange(currentRound);
        runPhase('inhale', pattern.inhale, () => {
          runPhase('holdIn', pattern.holdIn, () => {
            runPhase('exhale', pattern.exhale, () => {
              runPhase('holdOut', pattern.holdOut, () => {
                runRound(currentRound + 1);
              });
            });
          });
        });
      };

      runRound(1);
    },
    [getElapsedSeconds, isActive, onRoundChange, runPhase],
  );
}
