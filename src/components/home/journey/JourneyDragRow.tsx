import { useMemo, type ComponentType, type ReactNode, type RefObject } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
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
export default function JourneyDragRow(props: JourneyDragRowProps) {
  // A row's animated style computes its opening value once, at mount, and on
  // every later change restarts its worklet in an effect — a frame after the
  // render. That is fine for a list that has always been positioned by
  // transform, and wrong for the one render that switches a list from flow to
  // transforms: the rows would lose their layout slots a frame before they were
  // given their offsets, and paint stacked at the top. Mounting instead of
  // updating hands them the right offsets in the same commit that moves them.
  //
  // A list that knows its row heights up front never flips this. A list that
  // measures them flips it once, on the frame after its first layout, before
  // anything on screen can be interacted with.
  return (
    <PositionedRow
      key={props.controller.contentHeight == null ? 'flow' : 'positioned'}
      {...props}
    />
  );
}

function PositionedRow({
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
    pickup,
    dragging,
    lifted,
    gap,
    enabled,
    contentHeight,
    restingTiming,
  } = controller;
  /**
   * A positioned list carries the whole arrangement in the transform, so the
   * row's own slot in the layout says nothing about where it stands and never
   * moves. A list laid out in flow is already standing in its slot, so the
   * transform only says how far it is from it.
   */
  const positioned = contentHeight != null;
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
          lifted.value = true;
          translation.value = 0;
          // Where it stood as it was picked up. Every position below is
          // written down the list from the top, so the finger's travel has
          // something absolute to be added to.
          const current = order.value;
          pickup.value = journeyRowOffset(
            current.ids,
            heights.value,
            gap,
            current.ids.indexOf(id),
          );
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
          // Set down as it travels, not once it has arrived: the landing ends
          // on the same frame the new order is committed, and a lift released
          // there has no frames left to release in.
          lifted.value = false;
          const next = current.ids;
          // Where the row has to land: its slot in the proposed order, measured
          // from the slot it was picked up in. The drop animates onto that offset
          // and only then commits, so the commit renders the row exactly where it
          // already is.
          const landing =
            journeyRowOffset(next, heights.value, gap, next.indexOf(id)) -
            pickup.value;
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
      lifted,
      translation,
      pickup,
      order,
      heights,
      controller,
    ],
  );

  const dragStyle = useAnimatedStyle(() => {
    const held = activeId.value === id;
    const raised = held && lifted.value;
    const live = order.value.ids;
    // An order this row is not in, or one of a different length, was built from
    // a list the render has already moved on from — a row added or finished
    // elsewhere, a frame before the effect that resyncs. Its offsets would put
    // every row a slot out, so the row falls back to the order it was actually
    // rendered in. A drop is never this case: it commits exactly the order the
    // drag proposed, so both agree and the commit moves nothing.
    const at = live.length === ids.length ? live.indexOf(id) : -1;
    const resting =
      at < 0
        ? restingOffset
        : journeyRowOffset(live, heights.value, gap, at);

    // Flow rows are already standing in their slot; positioned rows are all
    // stacked at the top and stand only by this.
    const base = positioned ? 0 : restingOffset;
    const settle = dragging.value ? JOURNEY_DRAG_SETTLE : restingTiming;

    return {
      transform: [
        {
          // The held row follows the finger from where it was picked up. Every
          // other row slides to wherever the order puts it — and a flow row
          // only while something is held, because once the drop commits the
          // rows re-lay out and animating there replays the reset as a second
          // movement.
          translateY: held
            ? pickup.value + translation.value - base
            : dragging.value || positioned
              ? withTiming(resting - base, settle)
              : resting - base,
        },
        {
          scale: withTiming(
            raised ? JOURNEY_DRAG_LIFT_SCALE : 1,
            JOURNEY_DRAG_SETTLE,
          ),
        },
      ],
      zIndex: held ? 2 : 0,
      // zIndex alone does not raise a view out of its siblings' paint order on
      // Android, and the lift wants a shadow there anyway.
      elevation: withTiming(
        raised ? JOURNEY_DRAG_LIFT_ELEVATION : 0,
        JOURNEY_DRAG_SETTLE,
      ),
    };
  }, [id, ids, gap, restingOffset, positioned, restingTiming]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[positioned && styles.positioned, rowStyle, dragStyle]}
        onLayout={(event) => controller.measure(id, event)}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Every row at the top of the box, standing apart only by its transform.
  positioned: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
