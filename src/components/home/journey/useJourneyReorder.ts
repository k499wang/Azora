import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
  LayoutChangeEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  useSharedValue,
  type SharedValue,
  type WithTimingConfig,
} from 'react-native-reanimated';
import { duration, easing } from '../../../theme/motion';
import {
  journeyContentHeight,
  journeyLastMovableIndex,
  journeyRowsMeasured,
  moveJourneyRow,
  withoutFixedTail,
  type JourneyRowHeights,
} from './journeyReorder';

/**
 * How long a finger has to rest on a row before it picks it up. Long enough
 * that a tap and a scroll both still belong to the row and the page, short
 * enough that holding a card feels like it answers.
 */
export const JOURNEY_DRAG_LONG_PRESS_MS = 240;
/** Rows sliding out of the way, and the dropped row settling into its slot. */
export const JOURNEY_DRAG_SETTLE = {
  duration: duration.base,
  easing: easing.settle,
} as const;
/** How far the held row lifts off the list. */
export const JOURNEY_DRAG_LIFT_SCALE = 1.03;
/** The Android shadow that stands in for that lift. */
export const JOURNEY_DRAG_LIFT_ELEVATION = 8;

/**
 * The same move, offered to anyone who cannot hold and drag a row. VoiceOver
 * reads these off the row itself, so the order is reachable without the
 * gesture at all.
 */
export const JOURNEY_REORDER_ACTIONS = [
  { name: 'moveUp', label: 'Move up' },
  { name: 'moveDown', label: 'Move down' },
] as const;

/**
 * Spread onto a row's own pressable to make it reorderable without the
 * gesture. Both lists' rows need exactly this, and a row that carries the
 * actions but mishandles the event names is a row VoiceOver offers a move it
 * cannot make. A row pinned in place passes no `onMove` and gets none.
 */
export function journeyReorderActions(onMove: ((delta: number) => void) | undefined) {
  if (onMove == null) return {};
  return {
    accessibilityActions: JOURNEY_REORDER_ACTIONS,
    onAccessibilityAction: (
      event: NativeSyntheticEvent<{ actionName: string }>,
    ) => {
      if (event.nativeEvent.actionName === 'moveUp') onMove(-1);
      if (event.nativeEvent.actionName === 'moveDown') onMove(1);
    },
  } as const;
}

/**
 * The page a journey list is drawn on. Held so a drag can make it wait instead
 * of scrolling out from under the row being placed.
 */
/**
 * The gesture-handler-compatible ref for the scroll owner around a journey.
 * Animated scroll views have a distinct React ref type, so this boundary only
 * promises the opaque native ref that Gesture Handler consumes.
 */
export type JourneyScrollRef = RefObject<unknown>;

/**
 * Everything a row needs to take part in its list's drag.
 *
 * Shared values throughout, and deliberately so: a drag that told React what it
 * was doing would re-render the whole list on every slot the finger crossed.
 * Nothing here crosses back to the render pass until the row lands.
 */
export interface JourneyOrder {
  /** the committed order this was built from */
  key: string;
  ids: string[];
}

export interface JourneyReorderController {
  /** the order the rows are rendered in — the last one committed */
  ids: readonly string[];
  /** the vertical gap the rows are laid out with */
  gap: number;
  /** false while the list is loading, locked, or not yet measured */
  enabled: boolean;
  /** the row that stays last and cannot be picked up, if the list has one */
  fixedTailId: string | null;
  /** row heights on the JS side, for laying rows out at render time */
  measuredHeights: JourneyRowHeights;
  /** the same heights on the UI thread, for the gesture and the rail */
  heights: SharedValue<JourneyRowHeights>;
  /**
   * The order the drag is proposing, on the UI thread, stamped with the
   * committed order it was built from.
   *
   * The stamp is what makes a stale read safe. A row added or finished
   * elsewhere re-renders the list, and until the effect below catches up the UI
   * thread is still holding the order from before — offsets taken from it would
   * put every row a slot out, and a row that is not in it at all at the very
   * top. Rows and rails compare the stamp against the order they were rendered
   * from and sit still when the two disagree, which lasts a frame.
   */
  order: SharedValue<JourneyOrder>;
  /** the committed order's stamp, as rendered */
  committedKey: string;
  activeId: SharedValue<string | null>;
  /** the held row's travel from where it was picked up */
  translation: SharedValue<number>;
  /** where the held row stood when it was picked up, down the list */
  pickup: SharedValue<number>;
  /** the rows are in motion — a finger is down, or a refused drop is going home */
  dragging: SharedValue<boolean>;
  /**
   * The held row is off the list.
   *
   * Separate from `dragging` so the card can set itself down while it travels
   * to its slot instead of at the instant it arrives. That instant is also the
   * render that commits the new order, and an animation started there is
   * started into a style whose inputs have just changed — so it does not
   * animate at all, and a row that was 3% larger snaps back in one frame.
   */
  lifted: SharedValue<boolean>;
  /**
   * The rows carry their whole position in a transform, and the box they stand
   * in is this tall. Null for a list that lays its rows out in flow.
   *
   * This is the difference between a drop that re-lays the list out and one
   * that changes nothing but a number on the UI thread. Reanimated restarts a
   * style's worklet in an effect, so a re-render that moves a row's slot paints
   * one frame of the new slot with the old transform still on it — displaced by
   * however far the row was dragged. Rows that are positioned entirely by
   * transform have no slot to move: the commit is invisible.
   *
   * Only a list that knows its row heights before it lays them out can do this;
   * one that measures them would spend its first frame with every row stacked
   * at the top. See `positioned` in the options.
   */
  contentHeight: number | null;
  /** how a row moves when the list changes shape without a drag */
  restingTiming: WithTimingConfig;
  measure: (id: string, event: LayoutChangeEvent) => void;
  /** a row was picked up, so a release on the list is not a tap */
  onLift: () => void;
  /** the row landed; this order is the new one */
  onDrop: (ids: string[]) => void;
  /**
   * Whether a row is being held, read rather than rendered. A press that lands
   * on the row a finger just dropped has to be ignored, and asking React to
   * re-render the list to know that would cost the drag its whole point.
   */
  isArranging: () => boolean;
}

interface JourneyReorderOptions {
  /** the committed order; rows are rendered in it and never re-ordered mid-drag */
  ids: readonly string[];
  gap: number;
  /**
   * Row heights, when the list already knows them. A list whose rows resize
   * themselves — a to-do wrapping onto a third line — leaves this out and the
   * rows report their own; a list whose heights are a design constant passes
   * them, so an opening card does not spend a state update per animation frame.
   */
  heights?: JourneyRowHeights;
  /** off while the list is loading, locked, or too short to have an order */
  enabled?: boolean;
  /**
   * Position the rows by transform alone rather than laying them out in order.
   *
   * Only for a list that passes `heights` — a list that measures its rows would
   * have nothing to position them with on the frame they first mount. See
   * `contentHeight`.
   */
  positioned?: boolean;
  /** how a row moves when the list changes shape without a drag */
  restingTiming?: WithTimingConfig;
  /**
   * Rows on their way out. They give up their slot and its gap while still
   * mounted, so the rows around them close up as they fade rather than after
   * they have gone. Only for a `positioned` list.
   */
  collapsed?: ReadonlySet<string>;
  /**
   * The height a row joining a list already on screen stands in for until it
   * has measured itself — its smallest. Without one, the list makes no room
   * for the row until the frame after it mounts, and everything under the list
   * starts moving a beat behind the card it is making way for.
   *
   * Passed only once the list is on screen: on its first draw every row is
   * unmeasured, and placing them all by guess would move each one twice.
   */
  estimatedHeight?: number;
  /**
   * A last row that stays last: it cannot be picked up, nothing lands below it,
   * and it is left out of the order handed to `onReorder`.
   */
  fixedTailId?: string;
  onReorder: (ids: string[]) => void;
}

const NONE_COLLAPSED: ReadonlySet<string> = new Set();

/**
 * Drag-to-reorder for one list on Home's journey rail.
 *
 * Rows stay in their committed order for the whole gesture and are only ever
 * transformed, so React never re-parents the view under the finger holding it.
 * The drag builds its proposed order in a shared value; dropping commits it,
 * and every transform falls to zero in the same render that re-lays out the
 * rows, so the list lands without a frame of doubled movement.
 *
 * A whole drag costs one render, at the end. Everything that has to keep up
 * with the finger — the rows, and the rail drawn beside them — reads `order`
 * and `heights` from a worklet instead of being told about it in state.
 */
export function useJourneyReorder({
  ids,
  gap,
  heights: givenHeights,
  enabled = true,
  positioned = false,
  restingTiming = JOURNEY_DRAG_SETTLE,
  collapsed = NONE_COLLAPSED,
  estimatedHeight,
  fixedTailId,
  onReorder,
}: JourneyReorderOptions) {
  const tailId = fixedTailId ?? null;
  const heights = useSharedValue<JourneyRowHeights>(givenHeights ?? {});
  const committedKey = ids.join('|');
  const order = useSharedValue<JourneyOrder>({
    key: committedKey,
    ids: [...ids],
  });
  const activeId = useSharedValue<string | null>(null);
  const translation = useSharedValue(0);
  const pickup = useSharedValue(0);
  const dragging = useSharedValue(false);
  const lifted = useSharedValue(false);
  const [measured, setMeasured] = useState<JourneyRowHeights>({});
  const arranging = useRef(false);
  const restoring = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reorder = useRef(onReorder);
  reorder.current = onReorder;
  const latestIds = useRef(ids);
  latestIds.current = ids;
  const pendingMeasurements = useRef<JourneyRowHeights>({});
  const measurementFrame = useRef<number | null>(null);
  const measuredNow = useRef(measured);
  measuredNow.current = measured;

  // Nothing here renders: the committed order arriving is already a render, and
  // this only brings the UI thread's copy of it back in step. A list that
  // changed under the finger — a to-do finished elsewhere, a refetch landing —
  // also drops the drag rather than committing it against rows that have since
  // moved.
  useEffect(() => {
    order.value = { key: committedKey, ids: [...latestIds.current] };
    activeId.value = null;
    translation.value = 0;
    dragging.value = false;
    lifted.value = false;
    arranging.current = false;
  }, [committedKey, order, activeId, translation, dragging, lifted]);

  const measure = useCallback(
    (id: string, event: LayoutChangeEvent) => {
      if (givenHeights != null) return;
      const { height } = event.nativeEvent.layout;
      if (!latestIds.current.includes(id) || !Number.isFinite(height) || height <= 0) return;
      if ((pendingMeasurements.current[id] ?? measuredNow.current[id]) === height) return;
      pendingMeasurements.current[id] = height;
      if (measurementFrame.current != null) return;
      // Initial layout reports every row separately. Commit their heights
      // together so the list switches to positioned rows once per frame.
      measurementFrame.current = requestAnimationFrame(() => {
        measurementFrame.current = null;
        const pending = pendingMeasurements.current;
        pendingMeasurements.current = {};
        const visibleIds = new Set(latestIds.current);
        setMeasured((current) => {
          let next = current;
          for (const [rowId, rowHeight] of Object.entries(pending)) {
            if (!visibleIds.has(rowId) || current[rowId] === rowHeight) continue;
            if (next === current) next = { ...current };
            next[rowId] = rowHeight;
          }
          return next;
        });
      });
    },
    [givenHeights],
  );

  const measuredHeights = givenHeights ?? measured;
  const rowHeights = useMemo(() => {
    if (estimatedHeight == null) return measuredHeights;
    let next = measuredHeights;
    ids.forEach((id) => {
      if ((measuredHeights[id] ?? 0) > 0) return;
      if (next === measuredHeights) next = { ...measuredHeights };
      next[id] = estimatedHeight;
    });
    return next;
  }, [measuredHeights, ids, estimatedHeight]);
  // A slot of minus the gap cancels the gap after it, so every offset summed
  // past a collapsed row comes out as if the row were already gone.
  const slotHeights = useMemo(() => {
    if (collapsed.size === 0) return rowHeights;
    const next = { ...rowHeights };
    collapsed.forEach((id) => {
      if (next[id] != null) next[id] = -gap;
    });
    return next;
  }, [rowHeights, collapsed, gap]);

  /**
   * Sticky, and deliberately so.
   *
   * A row that has just been added has no height for a frame, which would take
   * this back to null — collapsing the box the rows stand in and, worse, taking
   * the list back to flow and then to transforms again. The last good height
   * holds the box open instead, and the new row slides its neighbours apart
   * once it has been measured.
   */
  const lastContentHeight = useRef<number | null>(null);
  const contentHeight = useMemo(() => {
    if (!positioned) return null;
    const standing = collapsed.size === 0 ? ids : ids.filter((id) => !collapsed.has(id));
    const next = journeyContentHeight(standing, rowHeights, gap);
    if (next != null) lastContentHeight.current = next;
    return next ?? lastContentHeight.current;
  }, [positioned, ids, rowHeights, gap, collapsed]);

  useEffect(() => {
    heights.value = slotHeights;
  }, [heights, slotHeights]);

  /** the drag's one step, for the accessibility actions and nothing else */
  const moveBy = useCallback((id: string, delta: number) => {
    const current = latestIds.current;
    const from = current.indexOf(id);
    const to = from + delta;
    const lastMovable = journeyLastMovableIndex(current, tailId);
    if (from < 0 || from > lastMovable || to < 0 || to > lastMovable) return;
    reorder.current(withoutFixedTail(moveJourneyRow(current, from, to), tailId));
  }, [tailId]);

  const onLift = useCallback(() => {
    arranging.current = true;
  }, []);
  const onDrop = useCallback((next: string[]) => {
    arranging.current = false;
    reorder.current(withoutFixedTail(next, tailId));
  }, [tailId]);
  const isArranging = useCallback(() => arranging.current, []);

  /**
   * Puts the rows back where the committed order says they stand.
   *
   * A drop hands the caller an order and trusts it to commit one. If it does
   * not — a schedule with no room left in the day, a list that changed while the
   * finger was down — nothing re-renders, and the rows would be left standing in
   * an order nothing else in the app agrees with. This is how the caller says
   * "not taken".
   *
   * It costs no render: the rows read the order off the UI thread, so they slide
   * home on their own. They slide rather than snap because a rejected drop
   * reading as a glitch is worse than it reading as a no — which is why the
   * motion flag is held up for the length of that slide and then dropped.
   */
  const restoreOrder = useCallback(() => {
    dragging.value = true;
    order.value = {
      key: latestIds.current.join('|'),
      ids: [...latestIds.current],
    };
    if (restoring.current != null) clearTimeout(restoring.current);
    restoring.current = setTimeout(() => {
      dragging.value = false;
      restoring.current = null;
    }, JOURNEY_DRAG_SETTLE.duration);
  }, [order, dragging]);

  useEffect(
    () => () => {
      if (restoring.current != null) clearTimeout(restoring.current);
      if (measurementFrame.current != null) cancelAnimationFrame(measurementFrame.current);
      measurementFrame.current = null;
      pendingMeasurements.current = {};
    },
    [],
  );

  const controller = useMemo<JourneyReorderController>(
    () => ({
      ids,
      gap,
      enabled: enabled && journeyRowsMeasured(ids, measuredHeights),
      fixedTailId: tailId,
      committedKey,
      measuredHeights: slotHeights,
      contentHeight,
      restingTiming,
      heights,
      order,
      activeId,
      translation,
      pickup,
      dragging,
      lifted,
      measure,
      onLift,
      onDrop,
      isArranging,
    }),
    [
      ids,
      gap,
      enabled,
      tailId,
      contentHeight,
      restingTiming,
      committedKey,
      measuredHeights,
      slotHeights,
      heights,
      order,
      activeId,
      translation,
      pickup,
      dragging,
      lifted,
      measure,
      onLift,
      onDrop,
      isArranging,
    ],
  );

  return {
    controller,
    /** moves a row one place, for the accessibility actions on it */
    moveBy,
    /** call this from `onReorder` when the new order is not taken */
    restoreOrder,
  };
}
