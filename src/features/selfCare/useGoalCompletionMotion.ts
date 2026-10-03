import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelAnimation,
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
import { startUiTimer } from '../../lib/ui/uiThreadTimer';

const CARD_SQUISH = 0.04;
const CHECK_SQUISH = 0.14;
const CHECK_ICON_PEAK = 1.35;
const FLASH_PEAK_OPACITY = 0.75;
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
// A card joining the list waits out most of the slide that opens its slot,
// then fades up into it, landing as the rows around it settle. Shown at once,
// it sat on top of whatever its slot was still pushing out of the way.
const ARRIVE_DELAY_MS = 180;
const ARRIVE_MS = duration.base;
const ARRIVE_SCALE = 0.96;

/** The tick drawn on the key; the draw slides a window exactly this wide. */
export const CHECK_MARK_SIZE = 24;

/** How long a finished card takes to fade out before the list closes its gap. */
export const GOAL_FILING_MS = duration.base;

/** How long a tick plays before anything may cover or replace the card. */
export const GOAL_COMPLETION_MOTION_MS = duration.fill;

/** Resolves once a tick started now has finished playing. */
export function goalCompletionMotionSettled(): Promise<void> {
  return new Promise((resolve) => {
    startUiTimer(GOAL_COMPLETION_MOTION_MS, resolve);
  });
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
  const mark = useSharedValue(done ? 1 : 0);
  const strike = useSharedValue(done ? 1 : 0);
  const pop = useSharedValue(0);
  const flash = useSharedValue(0);
  const burst = useSharedValue(0);
  const leave = useSharedValue(filing ? 1 : 0);
  const enter = useSharedValue(arriving && !reducedMotion ? 0 : 1);
  // The sparks are only mounted once a card is pressed here, so a long list
  // does not carry eight idle views per card. `prime` mounts them on the
  // press-in, a beat before the tap lands, so building them is not on the
  // frame the tick starts on; the burst waits long enough to cover a tap with
  // no press-in first.
  const [sparked, setSparked] = useState(false);
  const prime = useCallback(() => setSparked(true), []);
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
    [fill, mark, strike, pop, flash, burst, leave, enter].forEach(cancelAnimation);
    cancelUnlock.current?.();
  }, [fill, mark, strike, pop, flash, burst, leave, enter]);

  useEffect(() => {
    if (!arrivesOnMount.current) return;
    lockFor(ARRIVE_DELAY_MS + ARRIVE_MS);
    enter.value = withDelay(
      ARRIVE_DELAY_MS,
      withTiming(1, { duration: ARRIVE_MS, easing: easing.enter }),
    );
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
    mark.value = done ? 1 : 0;
    strike.value = done ? 1 : 0;
    pop.value = 0;
    flash.value = 0;
    burst.value = 0;
  }, [done, fill, mark, strike, pop, flash, burst]);

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
        lockFor(duration.fast);
        pop.value = 0;
        flash.value = 0;
        burst.value = 0;
        const undo = { duration: duration.fast, easing: easing.enter };
        fill.value = withTiming(0, undo);
        mark.value = withTiming(0, undo);
        strike.value = withTiming(0, undo);
        return;
      }
      lockFor(GOAL_COMPLETION_MOTION_MS);
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
      setSparked(true);
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
    [reducedMotion, fill, mark, strike, pop, flash, burst, lockFor],
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
  // Uncovered left to right, so the mark reads as drawn rather than faded in:
  // the window slides in from the left while the mark inside slides back the
  // same distance, so the mark stays put and only the window's edge moves.
  const checkMarkWindowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -CHECK_MARK_SIZE * (1 - mark.value) }],
  }));
  const checkMarkDoneStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: CHECK_MARK_SIZE * (1 - mark.value) }],
  }));

  return {
    strike,
    burst,
    sparked,
    locked,
    prime,
    play,
    cardStyle,
    flashStyle,
    checkStyle,
    checkFillStyle,
    checkMarkStyle,
    checkMarkTodoStyle,
    checkMarkWindowStyle,
    checkMarkDoneStyle,
  };
}
