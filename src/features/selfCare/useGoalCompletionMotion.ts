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
import { duration, easing } from '../../theme/motion';

const CARD_SQUISH = 0.04;
const CHECK_SQUISH = 0.14;
const CHECK_ICON_PEAK = 1.35;
const FLASH_PEAK_OPACITY = 0.75;
const CHECK_MARK_SIZE = 24;
// One beat after another, the way Things and Todoist pace a tick: the key goes
// down, green fills it, the mark draws itself in, sparks fly, and only then
// does the pen cross out the title.
const SQUISH_MS = 110;
const FILL_DELAY_MS = 40;
const FILL_MS = 400;
const MARK_DELAY_MS = 220;
const MARK_MS = 300;
const FLASH_DELAY_MS = 120;
const FLASH_IN_MS = 160;
const FLASH_OUT_MS = 640;
const BURST_DELAY_MS = 380;
const BURST_MS = 520;
const STRIKE_DELAY_MS = 420;
const STRIKE_MS = 440;
/** softer than `spring.bounce`, so the card swells back slowly enough to see */
const REBOUND_SPRING = { damping: 9, stiffness: 180, mass: 0.8 };
/** how far a card shrinks as it is filed away */
const FILING_SHRINK = 0.04;

/** How long a finished card takes to fade out before the list closes its gap. */
export const GOAL_FILING_MS = duration.base;

/** How long a tick plays before anything may cover or replace the card. */
export const GOAL_COMPLETION_MOTION_MS = duration.fill;

/** Resolves once a tick started now has finished playing. */
export function goalCompletionMotionSettled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, GOAL_COMPLETION_MOTION_MS));
}

/**
 * The tick on a to-do card: the key squishes and springs back, green blooms
 * out from its middle, the mark draws itself across the key, sparks burst off
 * it, the card bounces and flashes, and a line draws through the title.
 *
 * `play` starts it from the tap itself, on the UI thread, so it never waits
 * for the cache write and the list re-render behind it. A change the card did
 * not start — a refresh, another screen, a rollback — lands where it ends up.
 *
 * `filing` fades the card out where it stands, ahead of the list taking it off
 * the rail, so its slot is empty before anything moves into it.
 */
export function useGoalCompletionMotion(done: boolean, filing = false) {
  const reducedMotion = useReducedMotion();
  const fill = useSharedValue(done ? 1 : 0);
  const mark = useSharedValue(done ? 1 : 0);
  const strike = useSharedValue(done ? 1 : 0);
  const pop = useSharedValue(0);
  const flash = useSharedValue(0);
  const burst = useSharedValue(0);
  const leave = useSharedValue(filing ? 1 : 0);
  const playedTo = useRef<boolean | null>(null);

  useEffect(() => {
    const target = filing ? 1 : 0;
    leave.value = reducedMotion
      ? target
      : withTiming(target, {
          duration: GOAL_FILING_MS,
          easing: filing ? easing.exit : easing.enter,
        });
  }, [filing, reducedMotion, leave]);

  useEffect(() => {
    const started = playedTo.current === done;
    playedTo.current = null;
    if (started) return;
    fill.value = done ? 1 : 0;
    mark.value = done ? 1 : 0;
    strike.value = done ? 1 : 0;
  }, [done, fill, mark, strike]);

  const play = useCallback(
    (next: boolean) => {
      playedTo.current = next;
      const target = next ? 1 : 0;
      if (reducedMotion) {
        fill.value = target;
        mark.value = target;
        strike.value = target;
        return;
      }
      if (!next) {
        const undo = { duration: duration.fast, easing: easing.enter };
        fill.value = withTiming(0, undo);
        mark.value = withTiming(0, undo);
        strike.value = withTiming(0, undo);
        return;
      }
      pop.value = withSequence(
        withTiming(1, { duration: SQUISH_MS, easing: easing.enter }),
        withSpring(0, REBOUND_SPRING),
      );
      fill.value = withDelay(
        FILL_DELAY_MS,
        withTiming(1, { duration: FILL_MS, easing: easing.settle }),
      );
      mark.value = withDelay(
        MARK_DELAY_MS,
        withTiming(1, { duration: MARK_MS, easing: easing.enter }),
      );
      flash.value = withDelay(
        FLASH_DELAY_MS,
        withSequence(
          withTiming(1, { duration: FLASH_IN_MS, easing: easing.enter }),
          withTiming(0, { duration: FLASH_OUT_MS, easing: easing.burst }),
        ),
      );
      burst.value = 0;
      burst.value = withDelay(
        BURST_DELAY_MS,
        withTiming(1, { duration: BURST_MS, easing: easing.burst }),
      );
      strike.value = withDelay(
        STRIKE_DELAY_MS,
        withTiming(1, { duration: STRIKE_MS, easing: easing.settle }),
      );
    },
    [reducedMotion, fill, mark, strike, pop, flash, burst],
  );

  // The spring overshoots below zero, which is what swells the card past its
  // resting size on the way back.
  const cardStyle = useAnimatedStyle(() => ({
    opacity: 1 - leave.value,
    transform: [
      { scale: (1 - CARD_SQUISH * pop.value) * (1 - FILING_SHRINK * leave.value) },
    ],
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
    const t = mark.value;
    // 1 at both ends, CHECK_ICON_PEAK halfway: the mark swells as it draws
    // across the key and settles as it lands.
    return { transform: [{ scale: 1 + (CHECK_ICON_PEAK - 1) * 4 * t * (1 - t) }] };
  });
  const checkMarkTodoStyle = useAnimatedStyle(() => ({ opacity: 1 - fill.value }));
  // Uncovered left to right, so the mark reads as drawn rather than faded in.
  const checkMarkDoneStyle = useAnimatedStyle(() => ({
    width: CHECK_MARK_SIZE * mark.value,
  }));

  return {
    strike,
    burst,
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
