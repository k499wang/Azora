import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { BreathingCircleRef } from '../../shared/components/BreathingCircle';
import {
  startInhaleVibration,
  stopInhaleVibration,
} from '../../../../native/inhaleVibration';
import { startHoldHaptics, stopHoldHaptics } from '../../../../native/holdHaptics';
import type { BreathingPhase } from '../domain/breathingSessionTiming';

// Long enough that the circle animation always lands first when it is running,
// short enough that a phase which never reports back is not visibly stuck.
const MOTION_FALLBACK_GRACE_MS = 250;

export type { BreathingPhase } from '../domain/breathingSessionTiming';
export type RunBreathingPhase = (
  phase: BreathingPhase,
  durationSeconds: number,
  onComplete: () => void,
) => void;

interface UseBreathingPhaseRunnerOptions {
  circleRef: RefObject<BreathingCircleRef | null>;
  onPhaseChange: (phase: BreathingPhase) => void;
}

export function useBreathingPhaseRunner({
  circleRef,
  onPhaseChange,
}: UseBreathingPhaseRunnerOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motionFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingSecondsRef = useRef(0);
  const runIdRef = useRef(0);
  const activePhaseRef = useRef<BreathingPhase | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const elapsedSecondsRef = useRef(0);
  const mountedRef = useRef(true);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
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

  const clearMotionFallback = useCallback(() => {
    if (motionFallbackRef.current) {
      clearTimeout(motionFallbackRef.current);
      motionFallbackRef.current = null;
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
      clearMotionFallback();

      const remainingSeconds = Math.max(0, remainingSecondsRef.current);
      remainingSecondsRef.current = 0;
      setRemainingSeconds(0);
      activePhaseRef.current = null;
      onCompleteRef.current = null;

      if (remainingSeconds > 0) {
        addElapsedSeconds(remainingSeconds);
      }

      onComplete();
    },
    [addElapsedSeconds, clearMotionFallback, clearTimer],
  );

  // The circle animation is what normally completes a motion phase, but it
  // declines to animate at all while its screen is unfocused and then never
  // reports back. Without this the session would sit on that phase forever.
  // completePhase invalidates the run before continuing, so whichever arrives
  // first wins and the other is a no-op.
  const armMotionFallback = useCallback(
    (runId: number, remainingSeconds: number) => {
      clearMotionFallback();
      motionFallbackRef.current = setTimeout(
        () => {
          motionFallbackRef.current = null;
          completePhase(runId);
        },
        remainingSeconds * 1000 + MOTION_FALLBACK_GRACE_MS,
      );
    },
    [clearMotionFallback, completePhase],
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
      setRemainingSeconds(durationSeconds);
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
          setRemainingSeconds(remainingSeconds);
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

          const circle = circleRef.current;
          if (!circle) {
            startTimer(true);
            return;
          }

          // Armed before the animation starts so a phase that completes
          // immediately clears it rather than racing it.
          armMotionFallback(runId, durationSeconds);

          const finish = () => completePhase(runId);
          if (phase === 'inhale') circle.expand(durationSeconds, finish);
          else circle.contract(durationSeconds, finish);

          // The circle animation completes motion phases. This timer only
          // keeps elapsed time current while that animation is running.
          startTimer(false);
        });
        return;
      }

      startTimer(true);
    },
    [addElapsedSeconds, armMotionFallback, circleRef, clearTimer, completePhase],
  );

  const pause = useCallback(() => {
    if (!activePhaseRef.current || !onCompleteRef.current) return;

    clearTimer();
    clearMotionFallback();
    circleRef.current?.pause();
    stopInhaleVibration();
    stopHoldHaptics();
    setPaused(true);
  }, [circleRef, clearMotionFallback, clearTimer]);

  const resume = useCallback(() => {
    const phase = activePhaseRef.current;
    if (!phase || !onCompleteRef.current) return;

    const runId = runIdRef.current;
    const remainingSeconds = remainingSecondsRef.current;
    const isMotionPhase = phase === 'inhale' || phase === 'exhale';
    let motionHandledByCircle = false;
    setPaused(false);

    const finish = () => completePhase(runId);
    if (phase === 'inhale') {
      const circle = circleRef.current;
      if (circle) {
        motionHandledByCircle = true;
        armMotionFallback(runId, remainingSeconds);
        circle.resumeExpand(remainingSeconds, finish);
      }
      startInhaleVibration(remainingSeconds * 1000);
    } else if (phase === 'exhale') {
      const circle = circleRef.current;
      if (circle) {
        motionHandledByCircle = true;
        armMotionFallback(runId, remainingSeconds);
        circle.resumeContract(remainingSeconds, finish);
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
      setRemainingSeconds(remaining);
      addElapsedSeconds(1);

      if (remaining <= 0) {
        clearTimer();
        if (!isMotionPhase || !motionHandledByCircle) {
          completePhase(runId);
        }
      }
    }, 1000);
  }, [
    addElapsedSeconds,
    armMotionFallback,
    circleRef,
    clearTimer,
    completePhase,
  ]);

  const resetElapsed = useCallback(() => {
    elapsedSecondsRef.current = 0;
    remainingSecondsRef.current = 0;
    setElapsedSeconds(0);
    setRemainingSeconds(0);
  }, []);

  const getElapsedSeconds = useCallback(() => elapsedSecondsRef.current, []);

  const disposeActivePhase = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    clearMotionFallback();
    circleRef.current?.pause();
    remainingSecondsRef.current = 0;
    activePhaseRef.current = null;
    onCompleteRef.current = null;
    stopInhaleVibration();
    stopHoldHaptics();
  }, [circleRef, clearMotionFallback, clearTimer]);

  const cancel = useCallback(() => {
    disposeActivePhase();
    if (mountedRef.current) {
      setRemainingSeconds(0);
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
    remainingSeconds,
    paused,
    runPhase,
    pause,
    resume,
    resetElapsed,
    getElapsedSeconds,
    cancel,
  };
}
