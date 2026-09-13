import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

export interface SteppedProgressConfig {
  stepCount: number;
  /** How long the whole run takes when nothing pauses it. */
  totalDurationMs: number;
  /**
   * Fractions of the run at which the bar stops and `onInterrupt` fires. Must
   * be a stable reference — a fresh array on every render restarts the run.
   */
  interrupts?: readonly number[];
  /** Pause between the bar landing and `onDone`. */
  handoffDelayMs?: number;
  onStepComplete?: (index: number) => void;
  onInterrupt?: (index: number) => void;
  onDone: () => void;
}

export interface SteppedProgress {
  /** 0–1, for a width interpolation. Runs on the JS driver. */
  progress: Animated.Value;
  percent: number;
  completedSteps: number;
  isPaused: boolean;
  resume: () => void;
}

const DEFAULT_HANDOFF_MS = 700;
const MIN_LEG_SPEED = 0.65;
const LEG_SPEED_RANGE = 0.8;

/**
 * Walks one progress bar through a list of steps, landing exactly on each
 * step's share of the track so a checkmark and a percentage can never drift
 * apart.
 *
 * Legs run linear at jittered speeds so the fill never decelerates into a stall
 * at a junction — what varies is how long each leg takes, which reads as real
 * work speeding up and slowing down. The first leg eases in and the last eases
 * out so the run as a whole still starts and settles softly.
 *
 * An interrupt stops the bar mid-leg rather than on a junction: pausing between
 * beats is what reads as the work hitting something, where pausing on a
 * checkmark just reads as the next step being slow.
 */
export function useSteppedProgress({
  stepCount,
  totalDurationMs,
  interrupts,
  handoffDelayMs = DEFAULT_HANDOFF_MS,
  onStepComplete,
  onInterrupt,
  onDone,
}: SteppedProgressConfig): SteppedProgress {
  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const callbacks = useRef({ onStepComplete, onInterrupt, onDone });
  callbacks.current = { onStepComplete, onInterrupt, onDone };

  const legDurations = useRef<number[]>([]);
  if (legDurations.current.length !== stepCount) {
    const speeds = Array.from(
      { length: stepCount },
      () => MIN_LEG_SPEED + Math.random() * LEG_SPEED_RANGE,
    );
    const sum = speeds.reduce((total, speed) => total + speed, 0);
    legDurations.current = speeds.map((speed) => (speed / sum) * totalDurationMs);
  }

  const legRef = useRef(0);
  const pausedAtRef = useRef(0);
  const nextInterruptRef = useRef(0);
  const runRef = useRef<(leg: number, from: number) => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let handoff: ReturnType<typeof setTimeout>;
    const legSpan = 1 / stepCount;

    const run = (leg: number, from: number) => {
      legRef.current = leg;
      const target = (leg + 1) / stepCount;
      // A resumed leg only has the rest of its distance left to cover, so it
      // gets the matching slice of its duration instead of starting over.
      const remaining = Math.max(target - from, 0);
      const duration = legDurations.current[leg] * (remaining / legSpan);
      const easing =
        leg === 0 && from === 0
          ? Easing.in(Easing.quad)
          : leg === stepCount - 1
            ? Easing.out(Easing.quad)
            : Easing.linear;

      Animated.timing(progress, {
        toValue: target,
        duration,
        easing,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        setCompletedSteps(leg + 1);
        callbacks.current.onStepComplete?.(leg);
        if (leg + 1 < stepCount) {
          run(leg + 1, target);
          return;
        }
        handoff = setTimeout(() => {
          if (cancelled) return;
          callbacks.current.onDone();
        }, handoffDelayMs);
      });
    };
    runRef.current = run;

    const listener = progress.addListener(({ value }) => {
      setPercent(Math.round(value * 100));
      const at = interrupts?.[nextInterruptRef.current];
      if (at == null || value < at) return;
      nextInterruptRef.current += 1;
      pausedAtRef.current = value;
      progress.stopAnimation();
      setIsPaused(true);
      callbacks.current.onInterrupt?.(nextInterruptRef.current - 1);
    });

    run(0, 0);

    return () => {
      cancelled = true;
      progress.stopAnimation();
      progress.removeListener(listener);
      clearTimeout(handoff);
    };
  }, [progress, stepCount, handoffDelayMs, interrupts]);

  const resume = useCallback(() => {
    setIsPaused(false);
    runRef.current(legRef.current, pausedAtRef.current);
  }, []);

  return { progress, percent, completedSteps, isPaused, resume };
}
