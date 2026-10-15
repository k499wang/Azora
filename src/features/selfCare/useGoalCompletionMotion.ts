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
/** how far a card shrinks as it is filed away */
const FILING_SHRINK = 0.04;
// A card joining the list fades up for as long as the slide that opens its
// slot, so the card, the add row and the drawer arrive as one motion.
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
 * `filing` fades the card out as the list closes up over its slot, ahead of
 * it being taken off the rail. `arriving`,
 * read once as the card mounts, is the other way round: the card holds back
 * until the list has opened its slot.
 */
export function useGoalCompletionMotion(
  done: boolean,
  filing = false,
  arriving = false,
) {
  const reducedMotion = useReducedMotion();
  const fill = useSharedValue(done ? 1 : 0);
  const strike = useSharedValue(done ? 1 : 0);
  const pop = useSharedValue(0);
  const flash = useSharedValue(0);
  const leave = useSharedValue(filing ? 1 : 0);
  const enter = useSharedValue(arriving && !reducedMotion ? 0 : 1);
  // The title's strike-through is only mounted once a card is pressed here.
  // `prime` mounts it on the press-in, a beat before the tap lands, so
  // building it is not on the frame the tick starts on.
  const [inked, setInked] = useState(false);
  const prime = useCallback(() => setInked(true), []);
  const playedTo = useRef<boolean | null>(null);
  // Untouchable for as long as anything on it is moving — ticking, un-ticking,
  // fading out to be filed, fading in to join the list. A tap mid-motion used
  // to reverse it halfway, and the card vanished and came straight back.
  const [locked, setLocked] = useState(arriving && !reducedMotion);
  const cancelUnlock = useRef<(() => void) | null>(null);
  const lockFor = useCallback((ms: number) => {
    cancelUnlock.current?.();
    setLocked(true);
    cancelUnlock.current = startUiTimer(ms, () => {
      cancelUnlock.current = null;
      setLocked(false);
    });
  }, []);
  // Where `enter` and `leave` were last sent, kept here because reading a
  // shared value on the JS thread blocks it until the UI thread answers — on
  // the frames a tick is busiest.
  const arrivesOnMount = useRef(arriving && !reducedMotion);
  const leaveTarget = useRef(filing ? 1 : 0);

  useEffect(() => () => {
    [fill, strike, pop, flash, leave, enter].forEach(cancelAnimation);
    cancelUnlock.current?.();
  }, [fill, strike, pop, flash, leave, enter]);

  useEffect(() => {
    if (!arrivesOnMount.current) return;
    lockFor(ARRIVE_MS);
    enter.value = withTiming(1, { duration: ARRIVE_MS, easing: easing.enter });
  }, [enter, lockFor]);

  useEffect(() => {
    const target = filing ? 1 : 0;
    // Every card mounts here at rest; a timing to where it already is would
    // still run its full length on the UI thread, once per card on load.
    if (leaveTarget.current === target) return;
    leaveTarget.current = target;
    if (reducedMotion) {
      leave.value = target;
      return;
    }
    lockFor(GOAL_FILING_MS);
    // Fast off the mark both ways: the rows around a filed card close up over
    // its slot as it fades, so it has to be mostly gone before they reach it.
    leave.value = withTiming(target, {
      duration: GOAL_FILING_MS,
      easing: easing.enter,
    });
  }, [filing, reducedMotion, leave, lockFor]);

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
    opacity: enter.value * (1 - leave.value),
    transform: [
      {
        scale:
          (1 - CARD_SQUISH * pop.value) *
          (1 - FILING_SHRINK * leave.value) *
          (ARRIVE_SCALE + (1 - ARRIVE_SCALE) * enter.value),
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
