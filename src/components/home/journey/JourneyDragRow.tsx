import { useMemo, type ComponentType, type ReactNode, type RefObject } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  triggerLightHaptic,
  triggerTapHaptic,
} from '../../../native/tapHaptics';
import {
  journeyDropIndex,
  journeyRowOffset,
  moveJourneyRow,
} from './journeyReorder';
import {
  JOURNEY_DRAG_LIFT_ELEVATION,
  JOURNEY_DRAG_LIFT_SCALE,
  JOURNEY_DRAG_LONG_PRESS_MS,
  JOURNEY_DRAG_SETTLE,
  type JourneyReorderController,
  type JourneyScrollRef,
} from './useJourneyReorder';

interface JourneyDragRowProps {
  controller: JourneyReorderController;
  id: string;
  /** the row's place in the committed order — its resting slot */
  index: number;
  /**
   * The page the list sits on. A drag and a scroll are the same vertical
   * finger, so the scroll view is made to wait on this gesture rather than the
   * list being taken out from under the row being placed. Handing this to the
   * gesture keeps that arbitration on the UI thread — a `scrollEnabled` prop
   * flipped from state would cost a render at the exact moment of pickup.
   */
  scrollRef?: JourneyScrollRef;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * One draggable row on the journey rail.
 *
 * The row keeps its slot in the tree and moves by transform alone. A row that
 * is not being held slides to wherever the proposed order puts it; the held one
 * follows the finger from its own resting slot, so the two never fight over the
 * same offset and nothing overlaps but the row that was deliberately lifted.
 */
export default function JourneyDragRow({
  controller,
  id,
  index,
  scrollRef,
  style: rowStyle,
  children,
}: JourneyDragRowProps) {
  const {
    ids,
    committedKey,
    measuredHeights,
    heights,
    order,
    activeId,
    translation,
    dragging,
    gap,
    enabled,
  } = controller;
  // Its resting offset, taken from the same props the layout is built from.
  // Reading it off the shared heights instead would let the transform and the
  // layout disagree for a frame on the render that commits a drop — which is
  // the one frame the whole list would visibly jump on.
  const restingOffset = journeyRowOffset(ids, measuredHeights, gap, index);

  // Rebuilt only when something it closes over actually changed. A gesture
  // handed to the detector fresh on every render is a native reconfiguration
  // per render, and one of those renders is the commit that lands a drop.
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        // The scroll view is a plain component ref rather than another gesture,
        // which is what this overload is for; the library's own type only spells
        // out the never-null case.
        .blocksExternalGesture(
          ...(scrollRef == null
            ? []
            : [scrollRef as unknown as RefObject<ComponentType | undefined>]),
        )
        .activateAfterLongPress(JOURNEY_DRAG_LONG_PRESS_MS)
        .maxPointers(1)
        .shouldCancelWhenOutside(false)
        .onStart(() => {
          activeId.value = id;
          dragging.value = true;
          translation.value = 0;
          runOnJS(controller.onLift)();
          runOnJS(triggerLightHaptic)();
        })
        .onUpdate((event) => {
          const current = order.value;
          // The list changed under the finger. The drag is already lost — the
          // effect that resyncs will drop it — so it stops moving now rather
          // than spending a frame proposing slots in a list that has moved.
          if (activeId.value !== id || current.key !== committedKey) return;
          translation.value = event.translationY;
          const from = current.ids.indexOf(id);
          const target = journeyDropIndex(
            ids,
            heights.value,
            gap,
            index,
            event.translationY,
          );
          if (target === from) return;
          // A drag only ever permutes the order it was started on, so the stamp
          // carries through untouched.
          order.value = {
            key: current.key,
            ids: moveJourneyRow(current.ids, from, target),
          };
          runOnJS(triggerTapHaptic)();
        })
        .onFinalize(() => {
          const current = order.value;
          if (activeId.value !== id || current.key !== committedKey) return;
          const next = current.ids;
          // Where the row has to land: its slot in the proposed order, measured
          // from the slot it was picked up in. The drop animates onto that offset
          // and only then commits, so the commit renders the row exactly where it
          // already is.
          const landing =
            journeyRowOffset(next, heights.value, gap, next.indexOf(id)) -
            restingOffset;
          translation.value = withTiming(landing, JOURNEY_DRAG_SETTLE, (done) => {
            // A second row picked up while this one was still settling now owns the
            // drag, and clearing it here would drop that row where it stands.
            if (!done || activeId.value !== id) return;
            activeId.value = null;
            dragging.value = false;
            runOnJS(controller.onDrop)(next);
          });
        }),
    [
      id,
      index,
      gap,
      enabled,
      ids,
      committedKey,
      scrollRef,
      restingOffset,
      activeId,
      dragging,
      translation,
      order,
      heights,
      controller,
    ],
  );

  const dragStyle = useAnimatedStyle(() => {
    const held = activeId.value === id;
    const lifted = held && dragging.value;
    const live = order.value;
    // Built from an order this row is no longer being rendered in — the list
    // changed a frame ago and the effect that resyncs has not run yet. Every
    // offset from it would be a slot out, so the row sits where it was laid
    // out until the two agree again.
    const shift =
      live.key === committedKey
        ? journeyRowOffset(
            live.ids,
            heights.value,
            gap,
            live.ids.indexOf(id),
          ) - restingOffset
        : 0;
    return {
      transform: [
        {
          // The held row follows the finger from its own slot. Every other row
          // is animated only while something is actually held: once the drop
          // commits, the rows re-lay out and every shift falls to zero in the
          // same frame, and an animation there would replay the reset as a
          // second movement.
          translateY: held
            ? translation.value
            : dragging.value
              ? withTiming(shift, JOURNEY_DRAG_SETTLE)
              : shift,
        },
        { scale: withTiming(lifted ? JOURNEY_DRAG_LIFT_SCALE : 1, JOURNEY_DRAG_SETTLE) },
      ],
      zIndex: held ? 2 : 0,
      // zIndex alone does not raise a view out of its siblings' paint order on
      // Android, and the lift wants a shadow there anyway.
      elevation: lifted ? JOURNEY_DRAG_LIFT_ELEVATION : 0,
    };
  }, [id, gap, index, restingOffset, committedKey]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[rowStyle, dragStyle]}
        onLayout={(event) => controller.measure(id, event)}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
