import { useCallback, useEffect, useRef } from 'react';
import {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { duration, easing, spring } from '../../theme/motion';

const CARD_SQUISH = 0.035;
const CHECK_SQUISH = 0.12;
const CHECK_ICON_PEAK = 1.3;
const FLASH_PEAK_OPACITY = 0.7;
const SQUISH_MS = 90;
const FLASH_IN_MS = 120;
/** the fill has mostly landed before the line starts across the title */
const STRIKE_DELAY_MS = 80;

/** How long a tick plays before anything may cover or replace the card. */
export const GOAL_COMPLETION_MOTION_MS = duration.slower;

/** Resolves once a tick started now has finished playing. */
export function goalCompletionMotionSettled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, GOAL_COMPLETION_MOTION_MS));
}

/**
 * The tick on a to-do card: the key squishes and springs back, green blooms
 * out from its middle, the card bounces and flashes, and a line draws through
 * the title.
 *
 * `play` starts it from the tap itself, on the UI thread, so it never waits
 * for the cache write and the list re-render behind it. A change the card did
 * not start — a refresh, another screen, a rollback — lands where it ends up.
 */
export function useGoalCompletionMotion(done: boolean) {
  const reducedMotion = useReducedMotion();
  const fill = useSharedValue(done ? 1 : 0);
  const strike = useSharedValue(done ? 1 : 0);
  const pop = useSharedValue(0);
  const flash = useSharedValue(0);
  const playedTo = useRef<boolean | null>(null);

  useEffect(() => {
    const started = playedTo.current === done;
    playedTo.current = null;
    if (started) return;
    fill.value = done ? 1 : 0;
    strike.value = done ? 1 : 0;
  }, [done, fill, strike]);

  const play = useCallback(
    (next: boolean) => {
      playedTo.current = next;
      const target = next ? 1 : 0;
      if (reducedMotion) {
        fill.value = target;
        strike.value = target;
        return;
      }
      if (!next) {
        fill.value = withTiming(0, { duration: duration.fast, easing: easing.enter });
        strike.value = withTiming(0, { duration: duration.fast, easing: easing.enter });
        return;
      }
      fill.value = withTiming(1, { duration: duration.base, easing: easing.enter });
      strike.value = withDelay(
        STRIKE_DELAY_MS,
        withTiming(1, { duration: duration.base, easing: easing.settle }),
      );
      pop.value = withSequence(
        withTiming(1, { duration: SQUISH_MS, easing: easing.enter }),
        withSpring(0, spring.bounce),
      );
      flash.value = withSequence(
        withTiming(1, { duration: FLASH_IN_MS, easing: easing.enter }),
        withTiming(0, { duration: duration.slow, easing: easing.burst }),
      );
    },
    [reducedMotion, fill, strike, pop, flash],
  );

  // The spring overshoots below zero, which is what swells the card past its
  // resting size on the way back.
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - CARD_SQUISH * pop.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: FLASH_PEAK_OPACITY * flash.value,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      fill.value,
      [0, 1],
      [colors.border.default, colors.success[300]],
    ),
    transform: [{ scale: 1 - CHECK_SQUISH * pop.value }],
  }));
  const checkFillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fill.value }],
  }));
  const checkMarkStyle = useAnimatedStyle(() => {
    const t = fill.value;
    // 1 at both ends, CHECK_ICON_PEAK halfway: the mark swells as the green
    // passes under it and settles as the fill lands.
    return { transform: [{ scale: 1 + (CHECK_ICON_PEAK - 1) * 4 * t * (1 - t) }] };
  });
  const checkMarkTodoStyle = useAnimatedStyle(() => ({ opacity: 1 - fill.value }));
  const checkMarkDoneStyle = useAnimatedStyle(() => ({ opacity: fill.value }));

  return {
    strike,
    play,
    cardStyle,
    flashStyle,
    checkStyle,
    checkFillStyle,
    checkMarkStyle,
    checkMarkTodoStyle,
    checkMarkDoneStyle,
  };
}
