import { useMemo, useRef, type RefObject } from 'react';
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export const BREATH_EXHALED = 0;
export const BREATH_INHALED = 1;

type BreathAnimationCallback = () => void;

/**
 * Imperative driver for the breath envelope. Phase runners own the timeline and
 * call these; every visual, audio, and haptic layer reads the envelope instead
 * of tracking phase state of its own, so nothing can drift out of sync.
 */
export interface BreathEnvelopeController {
  expand: (durationSeconds: number, onComplete?: BreathAnimationCallback) => void;
  contract: (durationSeconds: number, onComplete?: BreathAnimationCallback) => void;
  pause: () => void;
  resumeExpand: (
    remainingSeconds: number,
    onComplete?: BreathAnimationCallback,
  ) => void;
  resumeContract: (
    remainingSeconds: number,
    onComplete?: BreathAnimationCallback,
  ) => void;
  reset: () => void;
}

export interface BreathEnvelope {
  /** 0 = fully exhaled, 1 = fully inhaled. */
  value: SharedValue<number>;
  controllerRef: RefObject<BreathEnvelopeController | null>;
}

function createController(
  value: SharedValue<number>,
): BreathEnvelopeController {
  // Linear easing keeps the visual position proportional to elapsed time, which
  // is what lets a paused phase resume from its remaining seconds exactly.
  const animateTo = (
    target: number,
    durationSeconds: number,
    onComplete?: BreathAnimationCallback,
  ) => {
    value.value = withTiming(
      target,
      { duration: durationSeconds * 1000, easing: Easing.linear },
      (finished) => {
        'worklet';
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      },
    );
  };

  return {
    expand(durationSeconds, onComplete) {
      animateTo(BREATH_INHALED, durationSeconds, onComplete);
    },
    contract(durationSeconds, onComplete) {
      animateTo(BREATH_EXHALED, durationSeconds, onComplete);
    },
    pause() {
      cancelAnimation(value);
    },
    resumeExpand(remainingSeconds, onComplete) {
      animateTo(BREATH_INHALED, remainingSeconds, onComplete);
    },
    resumeContract(remainingSeconds, onComplete) {
      animateTo(BREATH_EXHALED, remainingSeconds, onComplete);
    },
    reset() {
      cancelAnimation(value);
      value.value = BREATH_EXHALED;
    },
  };
}

export function useBreathEnvelope(): BreathEnvelope {
  const value = useSharedValue(BREATH_EXHALED);
  const controller = useMemo(() => createController(value), [value]);
  const controllerRef = useRef<BreathEnvelopeController | null>(controller);
  controllerRef.current = controller;

  return { value, controllerRef };
}
