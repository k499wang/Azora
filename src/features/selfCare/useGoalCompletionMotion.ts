import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelAnimation,
  interpolateColor,
  runOnUI,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { selfCareGoalTargetOpacity } from './domain/selfCareGoal';

const CARD_SQUISH = 0.04;
const FLASH_PEAK_OPACITY = 0.75;
// The key turns green the moment it is tapped; the card answers a beat later
// and the pen crosses out the title last.
const SQUISH_MS = 110;
const FLASH_DELAY_MS = 120;
const FLASH_IN_MS = 160;
const FLASH_OUT_MS = 640;
const STRIKE_DELAY_MS = 420;
const STRIKE_MS = 440;
/** softer than `spring.bounce`, so the card swells back slowly enough to see */
const REBOUND_SPRING = { damping: 9, stiffness: 180, mass: 0.8 };
const ARRIVE_MS = duration.slow;
const ARRIVE_SCALE = 0.96;

/** How long a finished card takes to fade out before the list closes its gap. */
export const GOAL_FILING_MS = duration.fast;

/** How long a tick plays before anything may cover or replace the card. */
export const GOAL_COMPLETION_MOTION_MS = duration.fill;

/** Resolves once a tick started now has finished playing. */
export function goalCompletionMotionSettled(): Promise<void> {
  return new Promise((resolve) => {
    startUiTimer(GOAL_COMPLETION_MOTION_MS, resolve);
  });
}

/**
 * The tick on a to-do card: the key turns green at once, the card bounces and
 * flashes, and a line draws through the title.
 *
 * `play` starts it from the tap itself, on the UI thread, so it never waits
 * for the cache write and the list re-render behind it. A change the card did
 * not start — a refresh, another screen, a rollback — lands where it ends up.
 *
 * `filing` fades the card out as the list closes up over its slot.
 * New cards grow into their slot without hiding a shown card.
 */
export function useGoalCompletionMotion(done: boolean, filing = false) {
  const reducedMotion = useReducedMotion();
  const fill = useSharedValue(done ? 1 : 0);
  const strike = useSharedValue(done ? 1 : 0);
  const pop = useSharedValue(0);
  const flash = useSharedValue(0);
  const arrivalScale = useSharedValue(reducedMotion ? 1 : ARRIVE_SCALE);
  // The title's strike-through is only mounted once a card is pressed here.
  // `prime` mounts it on the press-in, a beat before the tap lands, so
  // building it is not on the frame the tick starts on.
  const [inked, setInked] = useState(false);
  const prime = useCallback(() => setInked(true), []);
  const playedTo = useRef<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const cancelUnlock = useRef<(() => void) | null>(null);
  const lockFor = useCallback((ms: number) => {
    cancelUnlock.current?.();
    setLocked(true);
    cancelUnlock.current = startUiTimer(ms, () => {
      cancelUnlock.current = null;
      setLocked(false);
    });
  }, []);
  useEffect(() => () => {
    [fill, strike, pop, flash, arrivalScale].forEach(cancelAnimation);
    cancelUnlock.current?.();
  }, [fill, strike, pop, flash, arrivalScale]);

  useEffect(() => {
    arrivalScale.value = reducedMotion
      ? 1
      : withTiming(1, { duration: ARRIVE_MS, easing: easing.enter });
  }, [reducedMotion, arrivalScale]);

  useEffect(() => {
    const started = playedTo.current === done;
    playedTo.current = null;
    if (started) return;
    fill.value = done ? 1 : 0;
    strike.value = done ? 1 : 0;
    pop.value = 0;
    flash.value = 0;
  }, [done, fill, strike, pop, flash]);

  // Schedule the whole sequence once, avoiding a separate runtime dispatch
  // for each animated value on the frame accepting the tap.
  const animateCompletion = useCallback(
    (next: boolean) => {
      'worklet';
      const target = next ? 1 : 0;
      fill.value = target;
      if (reducedMotion) {
        strike.value = target;
        return;
      }
      if (!next) {
        pop.value = 0;
        flash.value = 0;
        strike.value = withTiming(0, { duration: duration.fast, easing: easing.enter });
        return;
      }
      pop.value = withSequence(
        withTiming(1, { duration: SQUISH_MS, easing: easing.enter }),
        withSpring(0, REBOUND_SPRING),
      );
      flash.value = withDelay(
        FLASH_DELAY_MS,
        withSequence(
          withTiming(1, { duration: FLASH_IN_MS, easing: easing.enter }),
          withTiming(0, { duration: FLASH_OUT_MS, easing: easing.burst }),
        ),
      );
      strike.value = withDelay(
        STRIKE_DELAY_MS,
        withTiming(1, { duration: STRIKE_MS, easing: easing.settle }),
      );
    },
    [reducedMotion, fill, strike, pop, flash],
  );
  const play = useCallback(
    (next: boolean) => {
      playedTo.current = next;
      if (!reducedMotion) {
        lockFor(next ? GOAL_COMPLETION_MOTION_MS : duration.fast);
        if (next) setInked(true);
      }
      runOnUI(animateCompletion)(next);
    },
    [animateCompletion, lockFor, reducedMotion],
  );

  // The spring overshoots below zero, which is what swells the card past its
  // resting size on the way back.
  const cardStyle = useAnimatedStyle(() => ({
    opacity: filing && !reducedMotion
      ? withTiming(selfCareGoalTargetOpacity(filing), {
          duration: GOAL_FILING_MS,
          easing: easing.enter,
        })
      : selfCareGoalTargetOpacity(filing),
    transform: [
      {
        scale: (1 - CARD_SQUISH * pop.value) * arrivalScale.value,
      },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: FLASH_PEAK_OPACITY * flash.value,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      fill.value,
      [0, 1],
      [colors.neutral[300], colors.success[300]],
    ),
  }));
  const checkDoneStyle = useAnimatedStyle(() => ({ opacity: fill.value }));
  const checkTodoStyle = useAnimatedStyle(() => ({ opacity: 1 - fill.value }));

  return {
    strike,
    inked,
    locked,
    prime,
    play,
    cardStyle,
    flashStyle,
    checkStyle,
    checkDoneStyle,
    checkTodoStyle,
  };
}
