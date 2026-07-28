import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import * as Haptics from 'expo-haptics';
import type { BreathingCircleRef } from '../../shared/components/BreathingCircle';
import {
  buildDailyBreathHoldPreparationPlan,
  type DailyBreathHoldPreparationStep,
  type DailyBreathHoldProtocol,
} from '../domain/dailyBreathHoldProtocol';
import { createDailyActiveClock } from '../domain/dailyActiveClock';
import type { DailyBreathHoldPhase } from '../domain/breathHoldPhases';
import { startInhaleVibration, stopInhaleVibration } from '../../../../native/inhaleVibration';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';

const HOLD_DISPLAY_REFRESH_MS = 200;

interface UseBreathHoldPhaseSequenceOptions {
  circleRef: RefObject<BreathingCircleRef | null>;
  protocol: DailyBreathHoldProtocol;
  onPhaseChange: (phase: DailyBreathHoldPhase) => void;
  onHoldStarted: () => void;
}

interface ActivePreparationStep {
  readonly runId: number;
  readonly step: DailyBreathHoldPreparationStep;
  readonly durationMs: number;
  readonly complete: () => void;
}

export function useBreathHoldPhaseSequence({
  circleRef,
  protocol,
  onPhaseChange,
  onHoldStarted,
}: UseBreathHoldPhaseSequenceOptions) {
  const preparationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runIdRef = useRef(0);
  const preparationScheduleIdRef = useRef(0);
  const holdStartedAtMsRef = useRef(0);
  const activePreparationStepRef = useRef<ActivePreparationStep | null>(null);
  const holdActiveRef = useRef(false);
  const pausedRef = useRef(false);
  const mountedRef = useRef(true);
  const preparationClockRef = useRef(createDailyActiveClock());
  const holdClockRef = useRef(createDailyActiveClock());
  const onPhaseChangeRef = useRef(onPhaseChange);
  const onHoldStartedRef = useRef(onHoldStarted);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [paused, setPaused] = useState(false);

  onPhaseChangeRef.current = onPhaseChange;
  onHoldStartedRef.current = onHoldStarted;

  const clearPreparationTimer = useCallback(() => {
    if (preparationTimerRef.current == null) return;
    clearTimeout(preparationTimerRef.current);
    preparationTimerRef.current = null;
  }, []);

  const clearHoldTicker = useCallback(() => {
    if (holdTickerRef.current == null) return;
    clearInterval(holdTickerRef.current);
    holdTickerRef.current = null;
  }, []);

  const updateDisplayedHoldSeconds = useCallback(() => {
    if (!mountedRef.current) return;
    const elapsedMs = holdClockRef.current.getElapsedMs(Date.now());
    setHoldSeconds(Math.floor(elapsedMs / 1000));
  }, []);

  const startHoldTicker = useCallback((runId: number) => {
    clearHoldTicker();
    updateDisplayedHoldSeconds();
    holdTickerRef.current = setInterval(() => {
      if (runIdRef.current !== runId || pausedRef.current || !holdActiveRef.current) {
        clearHoldTicker();
        return;
      }
      updateDisplayedHoldSeconds();
    }, HOLD_DISPLAY_REFRESH_MS);
  }, [clearHoldTicker, updateDisplayedHoldSeconds]);

  const schedulePreparationStep = useCallback((
    activeStep: ActivePreparationStep,
    remainingMs: number,
    resuming: boolean,
  ) => {
    clearPreparationTimer();
    const scheduleId = preparationScheduleIdRef.current + 1;
    preparationScheduleIdRef.current = scheduleId;
    const boundedRemainingMs = Math.max(0, remainingMs);
    const completeCurrentSchedule = () => {
      if (preparationScheduleIdRef.current !== scheduleId) return;
      activeStep.complete();
    };
    if (boundedRemainingMs === 0) {
      completeCurrentSchedule();
      return;
    }

    preparationTimerRef.current = setTimeout(
      completeCurrentSchedule,
      boundedRemainingMs,
    );

    requestAnimationFrame(() => {
      if (
        runIdRef.current !== activeStep.runId ||
        preparationScheduleIdRef.current !== scheduleId ||
        activePreparationStepRef.current !== activeStep ||
        pausedRef.current
      ) {
        return;
      }

      const circle = circleRef.current;
      if (circle == null) return;

      const remainingSeconds = boundedRemainingMs / 1000;
      if (activeStep.step.phase === 'preExhale') {
        stopInhaleVibration();
        if (resuming) circle.resumeContract(remainingSeconds, completeCurrentSchedule);
        else circle.contract(remainingSeconds, completeCurrentSchedule);
        return;
      }

      if (!resuming && activeStep.step.phase === 'preInhale' && activeStep.step.cycle === 1) {
        circle.reset();
      }
      startInhaleVibration(boundedRemainingMs);
      if (resuming) circle.resumeExpand(remainingSeconds, completeCurrentSchedule);
      else circle.expand(remainingSeconds, completeCurrentSchedule);
    });
  }, [circleRef, clearPreparationTimer]);

  const cancel = useCallback(() => {
    runIdRef.current += 1;
    preparationScheduleIdRef.current += 1;
    clearPreparationTimer();
    clearHoldTicker();
    activePreparationStepRef.current = null;
    holdActiveRef.current = false;
    pausedRef.current = false;
    preparationClockRef.current.reset();
    holdClockRef.current.reset();
    holdStartedAtMsRef.current = 0;
    circleRef.current?.pause();
    stopInhaleVibration();
    if (mountedRef.current) setPaused(false);
  }, [circleRef, clearHoldTicker, clearPreparationTimer]);

  const start = useCallback(() => {
    cancel();
    const runId = runIdRef.current;
    const preparationPlan = buildDailyBreathHoldPreparationPlan(protocol);
    setHoldSeconds(0);

    const beginHold = () => {
      if (runIdRef.current !== runId) return;

      clearPreparationTimer();
      activePreparationStepRef.current = null;
      preparationClockRef.current.reset();
      stopInhaleVibration();
      circleRef.current?.pause();
      holdActiveRef.current = true;
      holdStartedAtMsRef.current = Date.now();
      holdClockRef.current.start(holdStartedAtMsRef.current);
      setHoldSeconds(0);
      onHoldStartedRef.current();
      onPhaseChangeRef.current('hold');
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      startHoldTicker(runId);
    };

    const runPreparationStep = (stepIndex: number) => {
      if (runIdRef.current !== runId) return;

      const step = preparationPlan[stepIndex];
      if (step == null) {
        beginHold();
        return;
      }

      const durationMs = step.durationSeconds * 1000;
      let delivered = false;
      const activeStep: ActivePreparationStep = {
        runId,
        step,
        durationMs,
        complete: () => {
          if (
            delivered ||
            runIdRef.current !== runId ||
            pausedRef.current ||
            activePreparationStepRef.current !== activeStep
          ) {
            return;
          }

          delivered = true;
          preparationScheduleIdRef.current += 1;
          clearPreparationTimer();
          activePreparationStepRef.current = null;
          preparationClockRef.current.reset();
          stopInhaleVibration();
          runPreparationStep(stepIndex + 1);
        },
      };

      activePreparationStepRef.current = activeStep;
      preparationClockRef.current.start(Date.now());
      onPhaseChangeRef.current(step.phase);
      schedulePreparationStep(activeStep, durationMs, false);
    };

    runPreparationStep(0);
  }, [
    cancel,
    circleRef,
    clearPreparationTimer,
    protocol,
    schedulePreparationStep,
    startHoldTicker,
  ]);

  const pause = useCallback(() => {
    if (pausedRef.current) return;
    const activeStep = activePreparationStepRef.current;
    if (activeStep == null && !holdActiveRef.current) return;

    const nowMs = Date.now();
    pausedRef.current = true;
    if (activeStep != null) {
      preparationClockRef.current.pause(nowMs);
      preparationScheduleIdRef.current += 1;
      clearPreparationTimer();
      circleRef.current?.pause();
      stopInhaleVibration();
    } else {
      holdClockRef.current.pause(nowMs);
      clearHoldTicker();
      updateDisplayedHoldSeconds();
    }
    setPaused(true);
  }, [circleRef, clearHoldTicker, clearPreparationTimer, updateDisplayedHoldSeconds]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    const activeStep = activePreparationStepRef.current;
    if (activeStep == null && !holdActiveRef.current) return;

    const nowMs = Date.now();
    pausedRef.current = false;
    setPaused(false);
    if (activeStep != null) {
      preparationClockRef.current.resume(nowMs);
      const elapsedMs = preparationClockRef.current.getElapsedMs(nowMs);
      schedulePreparationStep(activeStep, activeStep.durationMs - elapsedMs, true);
      return;
    }

    holdClockRef.current.resume(nowMs);
    startHoldTicker(runIdRef.current);
  }, [schedulePreparationStep, startHoldTicker]);

  const getHoldStartedAtMs = useCallback(() => holdStartedAtMsRef.current, []);
  const getActiveHoldElapsedMs = useCallback(
    () => holdClockRef.current.getElapsedMs(Date.now()),
    [],
  );

  useEffect(
    () => () => {
      mountedRef.current = false;
      cancel();
    },
    [cancel],
  );

  return {
    holdSeconds,
    paused,
    start,
    pause,
    resume,
    cancel,
    getHoldStartedAtMs,
    getActiveHoldElapsedMs,
  };
}
