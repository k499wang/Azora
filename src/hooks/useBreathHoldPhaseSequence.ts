import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import * as Haptics from 'expo-haptics';
import type { BreathingCircleRef } from '../components/exercise/BreathingCircle';
import type { DailyBreathHoldPhase } from '../lib/breathHoldPhases';
import { startInhaleVibration, stopInhaleVibration } from '../native/inhaleVibration';
import { isHapticsEnabled } from '../services/preferences/hapticsPreference';

interface UseBreathHoldPhaseSequenceOptions {
  circleRef: RefObject<BreathingCircleRef | null>;
  prepCycles: number;
  prepInhaleSeconds: number;
  prepExhaleSeconds: number;
  finalInhaleSeconds: number;
  onPhaseChange: (phase: DailyBreathHoldPhase) => void;
  onHoldStarted: () => void;
}

type PrepPhase = 'preInhale' | 'preExhale' | 'inhale';

export function useBreathHoldPhaseSequence({
  circleRef,
  prepCycles,
  prepInhaleSeconds,
  prepExhaleSeconds,
  finalInhaleSeconds,
  onPhaseChange,
  onHoldStarted,
}: UseBreathHoldPhaseSequenceOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runIdRef = useRef(0);
  const holdStartedAtMsRef = useRef(0);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const onHoldStartedRef = useRef(onHoldStarted);
  const [holdSeconds, setHoldSeconds] = useState(0);

  onPhaseChangeRef.current = onPhaseChange;
  onHoldStartedRef.current = onHoldStarted;

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    stopInhaleVibration();
  }, [clearTimer]);

  const start = useCallback(() => {
    cancel();
    const runId = runIdRef.current;
    holdStartedAtMsRef.current = 0;
    setHoldSeconds(0);

    const beginHold = () => {
      if (runIdRef.current !== runId) return;

      clearTimer();
      stopInhaleVibration();
      circleRef.current?.pause();
      holdStartedAtMsRef.current = Date.now();
      setHoldSeconds(0);
      onHoldStartedRef.current();
      onPhaseChangeRef.current('hold');
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      timerRef.current = setInterval(() => {
        if (runIdRef.current !== runId) {
          clearTimer();
          return;
        }
        setHoldSeconds((current) => current + 1);
      }, 1000);
    };

    const runPhase = (phase: PrepPhase, cycle: number) => {
      if (runIdRef.current !== runId) return;

      clearTimer();
      onPhaseChangeRef.current(phase);
      const durationSeconds =
        phase === 'preInhale'
          ? prepInhaleSeconds
          : phase === 'preExhale'
            ? prepExhaleSeconds
            : finalInhaleSeconds;

      const continueSequence = () => {
        if (runIdRef.current !== runId) return;

        if (phase === 'preInhale') {
          runPhase('preExhale', cycle);
        } else if (phase === 'preExhale' && cycle < prepCycles) {
          runPhase('preInhale', cycle + 1);
        } else if (phase === 'preExhale') {
          runPhase('inhale', prepCycles);
        } else {
          beginHold();
        }
      };

      requestAnimationFrame(() => {
        if (runIdRef.current !== runId) return;
        const circle = circleRef.current;
        if (!circle) {
          continueSequence();
          return;
        }

        if (phase === 'preExhale') {
          stopInhaleVibration();
          circle.contract(durationSeconds, continueSequence);
          return;
        }

        if (phase === 'preInhale' && cycle === 1) circle.reset();
        startInhaleVibration(durationSeconds * 1000);
        circle.expand(durationSeconds, continueSequence);
      });
    };

    runPhase('preInhale', 1);
  }, [
    cancel,
    circleRef,
    clearTimer,
    finalInhaleSeconds,
    prepCycles,
    prepExhaleSeconds,
    prepInhaleSeconds,
  ]);

  const getHoldStartedAtMs = useCallback(() => holdStartedAtMsRef.current, []);

  useEffect(() => cancel, [cancel]);

  return {
    holdSeconds,
    start,
    cancel,
    getHoldStartedAtMs,
  };
}
