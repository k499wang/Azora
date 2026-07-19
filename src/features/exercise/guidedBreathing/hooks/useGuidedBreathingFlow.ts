import { useCallback, useRef } from 'react';
import type { BreathingPhaseDurations } from '../domain/breathingSessionTiming';
import {
  buildCyclicBreathingPlan,
  runBreathingSessionPlan,
} from '../domain/breathingSessionPlan';
import type { RunBreathingPhase } from './useBreathingPhaseRunner';

export interface GuidedBreathingSequenceCompletion {
  pattern: BreathingPhaseDurations;
  totalRounds: number;
  elapsedSeconds: number;
}

interface UseGuidedBreathingFlowOptions {
  isActive: () => boolean;
  runPhase: RunBreathingPhase;
  getElapsedSeconds: () => number;
  onRoundChange: (round: number) => void;
  onComplete: (completion: GuidedBreathingSequenceCompletion) => void;
}

export function useGuidedBreathingFlow({
  isActive,
  runPhase,
  getElapsedSeconds,
  onRoundChange,
  onComplete,
}: UseGuidedBreathingFlowOptions) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  return useCallback(
    (pattern: BreathingPhaseDurations, totalRounds: number) => {
      const plan = buildCyclicBreathingPlan(pattern, totalRounds);

      runBreathingSessionPlan({
        plan,
        isActive,
        runPhase,
        onRoundChange,
        onComplete: () => {
          onCompleteRef.current({
            pattern,
            totalRounds,
            elapsedSeconds: getElapsedSeconds(),
          });
        },
      });
    },
    [getElapsedSeconds, isActive, onRoundChange, runPhase],
  );
}
