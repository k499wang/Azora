import { useCallback, useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { scrollOffsetFor, type TourRect } from './tourGeometry';
import type { TourTargetId } from './tourSteps';

interface Scroller {
  scrollRef: React.RefObject<ScrollView | null>;
  /** live scroll offset, kept by the returned onScroll */
  offsetRef: React.MutableRefObject<number>;
}

type Registrations<T> = Map<TourTargetId, Map<symbol, T>>;

const nodes: Registrations<View> = new Map();
const scrollers: Registrations<Scroller> = new Map();
const layoutListeners = new Map<TourTargetId, () => void>();

function register<T>(
  registrations: Registrations<T>,
  id: TourTargetId,
  owner: symbol,
  value: T,
) {
  const owners = registrations.get(id) ?? new Map<symbol, T>();
  owners.set(owner, value);
  registrations.set(id, owners);
}

function unregister<T>(
  registrations: Registrations<T>,
  id: TourTargetId,
  owner: symbol,
) {
  const owners = registrations.get(id);
  if (owners == null) return;
  owners.delete(owner);
  if (owners.size === 0) registrations.delete(id);
}

function latest<T>(registrations: Registrations<T>, id: TourTargetId): T | null {
  const owners = registrations.get(id);
  if (owners == null) return null;

  let value: T | null = null;
  owners.forEach((registered) => {
    value = registered;
  });
  return value;
}

/**
 * Marks an element as a tour stop. Spread the result onto a wrapper View — it
 * carries the ref, `collapsable={false}` so the view survives, and an onLayout
 * that lets the overlay re-measure when late-arriving data resizes the element
 * under an already-placed cutout.
 */
export function useTourTarget(id: TourTargetId) {
  const owner = useRef(Symbol('tour-target')).current;

  const ref = useCallback(
    (node: View | null) => {
      unregister(nodes, id, owner);
      if (node != null) register(nodes, id, owner, node);
    },
    [id, owner],
  );

  useEffect(() => () => unregister(nodes, id, owner), [id, owner]);

  const onLayout = useCallback(() => {
    layoutListeners.get(id)?.();
  }, [id]);

  return { ref, onLayout, collapsable: false } as const;
}

/** Lets the active stop re-measure itself when its element changes size. */
export function watchTourTargetLayout(id: TourTargetId, onChange: () => void) {
  layoutListeners.set(id, onChange);
  return () => {
    if (layoutListeners.get(id) === onChange) layoutListeners.delete(id);
  };
}

/** Measures where a stop is now, without scrolling it anywhere. */
export function remeasureTourTarget(id: TourTargetId): Promise<TourRect | null> {
  return measureNode(latest(nodes, id));
}

/**
 * Lets the tour scroll a screen's own list. Spread the returned props onto the
 * ScrollView holding the targets; without it a stop below the fold is measured
 * where it currently sits rather than where the tour needs it.
 */
export function useTourScroller(targets: readonly TourTargetId[]) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const owner = useRef(Symbol('tour-scroller')).current;

  useEffect(() => {
    const scroller: Scroller = { scrollRef, offsetRef };
    targets.forEach((id) => register(scrollers, id, owner, scroller));
    return () => targets.forEach((id) => unregister(scrollers, id, owner));
    // Keyed on the ids themselves so an inline array does not re-register
    // every render.
  }, [owner, targets.join()]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  return { ref: scrollRef, onScroll, scrollEventThrottle: 16 } as const;
}

function measureNode(node: View | null): Promise<TourRect | null> {
  return new Promise((resolve) => {
    if (node == null) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      resolve(width <= 0 || height <= 0 ? null : { x, y, width, height });
    });
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MeasureOptions {
  /** where the element should end up once scrolled into view */
  desiredTop: number;
  /** longest a scroll may take to come to rest before we measure anyway */
  settleMs: number;
  /** how long to keep waiting for an element that has not registered yet */
  timeoutMs: number;
  /** false when the user has requested reduced motion */
  animated: boolean;
}

const POLL_MS = 60;
const SCROLL_START_GRACE_MS = 120;
const REQUIRED_STABLE_SAMPLES = 3;

function isSamePosition(a: TourRect, b: TourRect) {
  return Math.abs(a.y - b.y) < 0.5 && Math.abs(a.height - b.height) < 0.5;
}

/**
 * Waits for a stop to exist and have a size.
 *
 * React runs a child's effects before its parent's, so the overlay asks for a
 * target before the screen holding it has registered one — and a tab mounting
 * for the first time measures zero-sized for a few frames after that. Polling
 * covers both instead of dropping the step.
 */
async function measureWhenReady(
  id: TourTargetId,
  timeoutMs: number,
): Promise<TourRect | null> {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const rect = await measureNode(latest(nodes, id));
    if (rect != null) return rect;
    if (Date.now() >= deadline) return null;
    await wait(POLL_MS);
  }
}

/**
 * Follows a scrolling element until it comes to rest.
 *
 * A fixed delay cannot know how long a scroll animation takes: too short and
 * the cutout is drawn mid-flight at the wrong place, too long and the tour
 * sits dark doing nothing. Several identical measurements mean it has landed.
 */
async function measureWhenSettled(
  id: TourTargetId,
  fallback: TourRect,
  settleMs: number,
): Promise<TourRect> {
  const deadline = Date.now() + settleMs;
  let previous: TourRect | null = null;
  let stableSamples = 0;

  // Give Fabric/native scrolling a chance to begin before equal samples can
  // count as settled. Three stable polls then cover more than one render frame.
  await wait(Math.min(SCROLL_START_GRACE_MS, settleMs));

  for (;;) {
    const rect = await measureNode(latest(nodes, id));
    if (rect != null) {
      stableSamples = previous != null && isSamePosition(rect, previous)
        ? stableSamples + 1
        : 1;
      if (stableSamples >= REQUIRED_STABLE_SAMPLES) return rect;
      previous = rect;
    }
    if (Date.now() >= deadline) return previous ?? fallback;
    await wait(POLL_MS);
  }
}

/**
 * Scrolls a stop into a consistent position, then measures where it landed.
 * The scroll is unconditional so every step visibly moves the page.
 */
export async function measureTourTarget(
  id: TourTargetId,
  { desiredTop, settleMs, timeoutMs, animated }: MeasureOptions,
): Promise<TourRect | null> {
  const initial = await measureWhenReady(id, timeoutMs);
  if (initial == null) return null;

  const scroller = latest(scrollers, id);
  const scroll = scroller?.scrollRef.current;
  if (scroller == null || scroll == null) return initial;

  scroll.scrollTo({
    y: scrollOffsetFor(initial, scroller.offsetRef.current, desiredTop),
    animated,
  });

  if (!animated) {
    await wait(POLL_MS);
    return (await measureNode(latest(nodes, id))) ?? initial;
  }

  return measureWhenSettled(id, initial, settleMs);
}
