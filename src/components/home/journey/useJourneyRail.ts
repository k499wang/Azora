import { useMemo, useRef } from 'react';
import {
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';
import {
  journeyRailEnds,
  type JourneyRailEnds,
  type JourneyRailShape,
} from './journeyReorder';
import {
  JOURNEY_DRAG_SETTLE,
  type JourneyReorderController,
} from './useJourneyReorder';

interface JourneyRailOptions {
  controller: JourneyReorderController;
  /** the committed order, exactly as the rows were rendered from it */
  ids: readonly string[];
  /** the box the rail is drawn in, when its ends are inset from that */
  height?: number;
  /** how the rail moves when nothing is being dragged */
  timing: WithTimingConfig;
  shape: JourneyRailShape;
  /** draws only the done rows leading the order — see `journeyRailEnds` */
  done?: Readonly<Record<string, boolean>>;
}

/**
 * The dotted line beside a journey list, following the order the rows are
 * actually in — including the order a drag is only proposing.
 *
 * Both of Home's lists draw one, and both got it wrong in the same two ways
 * before this existed, which is why it is here rather than in each of them:
 *
 *   · A drag has to move the rail without re-rendering the section, so the
 *     proposed order is read from the UI thread. That order is stamped with the
 *     committed order it was built from, and a stamp that no longer matches
 *     means the render has moved on and the shared copy is a frame behind —
 *     the rail then spans the rows it was actually rendered for, not the ones
 *     the stale order names.
 *   · A row that has mounted but not been laid out has no height yet. The rail
 *     holds its last good ends through that rather than collapsing or
 *     unmounting, so adding a to-do does not blink the line off the screen.
 *
 * The resting shape is worked out in the render pass, where the heights already
 * are; the worklet only does the work a live drag needs.
 */
export function useJourneyRail({
  controller,
  ids,
  height = 0,
  timing,
  shape,
  done,
}: JourneyRailOptions) {
  const { order, heights, dragging, gap, committedKey, measuredHeights } =
    controller;

  const lastEnds = useRef<JourneyRailEnds | null>(null);
  const restingEnds = useMemo(() => {
    const next = height > 0
      ? journeyRailEnds(ids, measuredHeights, gap, height, shape, done)
      : null;
    if (next != null) lastEnds.current = next;
    return next ?? lastEnds.current;
  }, [ids, measuredHeights, gap, height, shape, done]);

  const top = useSharedValue(0);
  const bottom = useSharedValue(0);
  const placed = useSharedValue(false);

  useAnimatedReaction(() => {
    if (height <= 0) return null;
    const proposed = order.value;
    const live = proposed.key === committedKey ? proposed.ids : null;
    return (
      live == null
        ? restingEnds
        : journeyRailEnds(live, heights.value, gap, height, shape, done)
    );
  }, (rail) => {
    // Hold the last placement while a joining row is still unmeasured.
    if (rail == null) return;

    // The first measurement places the line; animating from zero insets would
    // briefly draw a full-height blue line beyond the journey's markers.
    if (!placed.value) {
      top.value = rail.top;
      bottom.value = rail.bottom;
      placed.value = true;
      return;
    }

    // A row being dropped settles faster than a card opens, and the rail is one
    // line with the rows: it moves on whichever of the two is happening.
    const settle = dragging.value ? JOURNEY_DRAG_SETTLE : timing;
    top.value = withTiming(rail.top, settle);
    bottom.value = withTiming(rail.bottom, settle);
  }, [restingEnds, committedKey, gap, height, shape, timing, done]);

  return useAnimatedStyle(() => ({
    opacity: placed.value ? 1 : 0,
    top: top.value,
    bottom: bottom.value,
  }));
}
