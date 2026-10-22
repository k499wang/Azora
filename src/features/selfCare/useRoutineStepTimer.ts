import { useEffect, useRef, useState } from 'react';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { duration as motionDuration } from '../../theme/motion';

interface UseRoutineStepTimerOptions {
  /** True while a step is on screen. */
  active: boolean;
  paused: boolean;
  /** The step's length, or null for an open-ended step that counts up. */
  durationMs: number | null;
  /** Changes when the step does, which starts the clock over. */
  stepKey: string;
  /** Called once when a timed step runs out. */
  onElapsed: () => void;
}

interface RoutineStepTimer {
  /** Seconds left on a timed step, or seconds spent on an open-ended one. */
  seconds: number;
  /** 1 when the step starts, 0 when it has run out; always 1 when open-ended. */
  fill: number;
  /** Share of a timed step used up, moved smoothly on the UI thread; 0 when open-ended. */
  progress: SharedValue<number>;
}

const TICK_MS = 1000;
/** How long the arc takes to catch up when the step or its length changes. */
const SETTLE_MS = motionDuration.base;

export function useRoutineStepTimer({
  active,
  paused,
  durationMs,
  stepKey,
  onElapsed,
}: UseRoutineStepTimerOptions): RoutineStepTimer {
  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;
  const [elapsed, setElapsed] = useState({ stepKey, ms: 0 });
  const banked = useRef({ stepKey, ms: 0 });
  const fired = useRef(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active || durationMs == null) {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: SETTLE_MS });
    }
  }, [active, durationMs, progress]);

  useEffect(() => {
    if (!active) return;
    if (paused) {
      if (durationMs != null && durationMs > 0 && banked.current.stepKey === stepKey) {
        progress.value = withTiming(Math.min(1, banked.current.ms / durationMs), {
          duration: SETTLE_MS,
        });
      }
      return;
    }
    if (banked.current.stepKey !== stepKey) {
      banked.current = { stepKey, ms: 0 };
      fired.current = false;
    }
    const base = banked.current.ms;
    if (durationMs != null && durationMs > base) fired.current = false;
    const runStart = Date.now();
    let cancel = () => {};

    if (durationMs != null && durationMs > 0) {
      const settleMs = Math.min(SETTLE_MS, Math.max(0, durationMs - base));
      progress.value = withSequence(
        withTiming(Math.min(1, (base + settleMs) / durationMs), { duration: settleMs }),
        withTiming(1, {
          duration: Math.max(0, durationMs - base - settleMs),
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        }),
      );
    }

    const tick = () => {
      const ms = base + Date.now() - runStart;
      setElapsed({ stepKey, ms });
      if (durationMs != null && ms >= durationMs) {
        if (!fired.current) {
          fired.current = true;
          onElapsedRef.current();
        }
        return;
      }
      const untilNextSecond = TICK_MS - (ms % TICK_MS);
      cancel = startUiTimer(
        durationMs == null
          ? untilNextSecond
          : Math.min(untilNextSecond, durationMs - ms),
        tick,
      );
    };
    tick();

    return () => {
      cancel();
      cancelAnimation(progress);
      banked.current = { stepKey, ms: base + Date.now() - runStart };
    };
  }, [active, paused, durationMs, stepKey, progress]);

  const elapsedMs = elapsed.stepKey === stepKey ? elapsed.ms : 0;
  if (durationMs == null) {
    return { seconds: Math.floor(elapsedMs / TICK_MS), fill: 1, progress };
  }
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  return {
    seconds: Math.ceil(remainingMs / TICK_MS),
    fill: durationMs > 0 ? remainingMs / durationMs : 0,
    progress,
  };
}
