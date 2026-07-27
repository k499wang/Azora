import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { BreathEnvelopeController } from '../../shared/breathEnvelope';
import {
  startInhaleVibration,
  stopInhaleVibration,
} from '../../../../native/inhaleVibration';
import { startHoldHaptics, stopHoldHaptics } from '../../../../native/holdHaptics';
import type { BreathingPhase } from '../domain/breathingSessionTiming';

export type { BreathingPhase } from '../domain/breathingSessionTiming';
export type RunBreathingPhase = (
  phase: BreathingPhase,
  durationSeconds: number,
  onComplete: () => void,
) => void;

interface UseBreathingPhaseRunnerOptions {
  envelopeRef: RefObject<BreathEnvelopeController | null>;
  onPhaseChange: (phase: BreathingPhase) => void;
}

export function useBreathingPhaseRunner({
  envelopeRef,
  onPhaseChange,
}: UseBreathingPhaseRunnerOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingSecondsRef = useRef(0);
  const runIdRef = useRef(0);
  const activePhaseRef = useRef<BreathingPhase | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const elapsedSecondsRef = useRef(0);
  const mountedRef = useRef(true);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const addElapsedSeconds = useCallback((seconds: number) => {
    elapsedSecondsRef.current += seconds;
    setElapsedSeconds(elapsedSecondsRef.current);
  }, []);

  const completePhase = useCallback(
    (runId: number) => {
      if (runIdRef.current !== runId) return;

      const onComplete = onCompleteRef.current;
      if (!onComplete) return;

      // Invalidate this run before invoking its continuation so an animation
      // and its fallback timer can never complete the same phase twice.
      runIdRef.current += 1;
      clearTimer();

      const remainingSeconds = Math.max(0, remainingSecondsRef.current);
      remainingSecondsRef.current = 0;
      activePhaseRef.current = null;
      onCompleteRef.current = null;

      if (remainingSeconds > 0) {
        addElapsedSeconds(remainingSeconds);
      }

      onComplete();
    },
    [addElapsedSeconds, clearTimer],
  );

  const runPhase = useCallback(
    (phase: BreathingPhase, durationSeconds: number, onComplete: () => void) => {
      if (durationSeconds === 0) {
        onComplete();
        return;
      }

      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      activePhaseRef.current = phase;
      onCompleteRef.current = onComplete;
      remainingSecondsRef.current = durationSeconds;
      setPaused(false);
      onPhaseChangeRef.current(phase);

      if (phase === 'inhale') {
        startInhaleVibration(durationSeconds * 1000);
        stopHoldHaptics();
      } else if (phase === 'holdIn' || phase === 'holdOut') {
        stopInhaleVibration();
        startHoldHaptics();
      } else {
        stopInhaleVibration();
        stopHoldHaptics();
      }

      const startTimer = (advanceWhenFinished: boolean) => {
        if (runIdRef.current !== runId) return;

        let remainingSeconds = durationSeconds;
        clearTimer();
        timerRef.current = setInterval(() => {
          if (runIdRef.current !== runId) {
            clearTimer();
            return;
          }

          remainingSeconds = Math.max(0, remainingSeconds - 1);
          remainingSecondsRef.current = remainingSeconds;
          addElapsedSeconds(1);

          if (remainingSeconds <= 0) {
            clearTimer();
            if (advanceWhenFinished) {
              completePhase(runId);
            }
          }
        }, 1000);
      };

      const isMotionPhase = phase === 'inhale' || phase === 'exhale';
      if (isMotionPhase) {
        requestAnimationFrame(() => {
          if (runIdRef.current !== runId) return;

          const envelope = envelopeRef.current;
          if (!envelope) {
            startTimer(true);
            return;
          }

          const finish = () => completePhase(runId);
          if (phase === 'inhale') envelope.expand(durationSeconds, finish);
          else envelope.contract(durationSeconds, finish);

          // The envelope animation completes motion phases. This timer only
          // keeps elapsed time current while that animation is running.
          startTimer(false);
        });
        return;
      }

      startTimer(true);
    },
    [addElapsedSeconds, envelopeRef, clearTimer, completePhase],
  );

  const pause = useCallback(() => {
    if (!activePhaseRef.current || !onCompleteRef.current) return;

    clearTimer();
    envelopeRef.current?.pause();
    stopInhaleVibration();
    stopHoldHaptics();
    setPaused(true);
  }, [envelopeRef, clearTimer]);

  const resume = useCallback(() => {
    const phase = activePhaseRef.current;
    if (!phase || !onCompleteRef.current) return;

    const runId = runIdRef.current;
    const remainingSeconds = remainingSecondsRef.current;
    const isMotionPhase = phase === 'inhale' || phase === 'exhale';
    let motionHandledByEnvelope = false;
    setPaused(false);

    const finish = () => completePhase(runId);
    if (phase === 'inhale') {
      const envelope = envelopeRef.current;
      if (envelope) {
        motionHandledByEnvelope = true;
        envelope.resumeExpand(remainingSeconds, finish);
      }
      startInhaleVibration(remainingSeconds * 1000);
    } else if (phase === 'exhale') {
      const envelope = envelopeRef.current;
      if (envelope) {
        motionHandledByEnvelope = true;
        envelope.resumeContract(remainingSeconds, finish);
      }
    } else {
      startHoldHaptics();
    }

    let remaining = remainingSeconds;
    clearTimer();
    timerRef.current = setInterval(() => {
      if (runIdRef.current !== runId) {
        clearTimer();
        return;
      }

      remaining = Math.max(0, remaining - 1);
      remainingSecondsRef.current = remaining;
      addElapsedSeconds(1);

      if (remaining <= 0) {
        clearTimer();
        if (!isMotionPhase || !motionHandledByEnvelope) {
          completePhase(runId);
        }
      }
    }, 1000);
  }, [addElapsedSeconds, envelopeRef, clearTimer, completePhase]);

  const resetElapsed = useCallback(() => {
    elapsedSecondsRef.current = 0;
    setElapsedSeconds(0);
  }, []);

  const getElapsedSeconds = useCallback(() => elapsedSecondsRef.current, []);

  const disposeActivePhase = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    remainingSecondsRef.current = 0;
    activePhaseRef.current = null;
    onCompleteRef.current = null;
    stopInhaleVibration();
    stopHoldHaptics();
  }, [clearTimer]);

  const cancel = useCallback(() => {
    disposeActivePhase();
    if (mountedRef.current) {
      setPaused(false);
    }
  }, [disposeActivePhase]);

  useEffect(
    () => () => {
      mountedRef.current = false;
      disposeActivePhase();
    },
    [disposeActivePhase],
  );

  return {
    elapsedSeconds,
    paused,
    runPhase,
    pause,
    resume,
    resetElapsed,
    getElapsedSeconds,
    cancel,
  };
}
