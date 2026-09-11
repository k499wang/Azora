import { useCallback, useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { scrollOffsetFor, type TourRect } from './tourGeometry';
import { sampleUntilStable, trackMovement, wait } from './tourSampling';
import type { TourTargetId } from './tourSteps';

interface Scroller {
  scrollRef: React.RefObject<ScrollView | null>;
  /** live scroll offset, kept by the returned onScroll */
  offsetRef: React.MutableRefObject<number>;
}

type Registrations<T> = Map<TourTargetId, Map<symbol, T>>;

const nodes: Registrations<View> = new Map();
const scrollers: Registrations<Scroller> = new Map();

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
 * carries the ref and `collapsable={false}` so the view survives to be
 * measured. Movement is followed by `trackTourTarget`, not by an onLayout:
 * anything growing *above* the element moves it without changing its own
 * layout, and onLayout never fires for that.
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

  return { ref, collapsable: false } as const;
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

interface MeasureOptions {
  /** where the element should end up once scrolled into view */
  desiredTop: number;
  /** longest a scroll may take to come to rest before we measure anyway */
  settleMs: number;
  /** how long to keep waiting for an element to register and hold still */
  timeoutMs: number;
  /** false when the user has requested reduced motion */
  animated: boolean;
}

const POLL_MS = 80;
const SCROLL_START_GRACE_MS = 120;
/** how often a placed stop is checked for having moved under the overlay */
const TRACK_POLL_MS = 250;

/**
 * Scrolls a stop into a consistent position, then measures where it landed.
 * The scroll is unconditional so every step visibly moves the page.
 *
 * A target that never held still inside `timeoutMs` returns null rather than a
 * guess: a cutout drawn around a rect that was already stale when it was taken
 * is the dark screen with the highlight nowhere on it.
 */
export async function measureTourTarget(
  id: TourTargetId,
  { desiredTop, settleMs, timeoutMs, animated }: MeasureOptions,
): Promise<TourRect | null> {
  const measure = () => measureNode(latest(nodes, id));
  const initial = await sampleUntilStable(measure, { timeoutMs, pollMs: POLL_MS });
  if (!initial.stable || initial.rect == null) return null;

  const scroller = latest(scrollers, id);
  const scroll = scroller?.scrollRef.current;
  // A stop with no list of its own — a sticky header action — is already where
  // it is going to be, because it was measured stable.
  if (scroller == null || scroll == null) return initial.rect;

  scroll.scrollTo({
    y: scrollOffsetFor(initial.rect, scroller.offsetRef.current, desiredTop),
    animated,
  });

  if (!animated) {
    await wait(POLL_MS);
    return (await measure()) ?? initial.rect;
  }

  const settled = await sampleUntilStable(measure, {
    timeoutMs: settleMs,
    pollMs: POLL_MS,
    graceMs: SCROLL_START_GRACE_MS,
  });
  return settled.rect ?? initial.rect;
}

/**
 * Follows a placed stop for as long as it is showing, reporting every move.
 *
 * The screen underneath keeps working while the overlay covers it, and a shift
 * in anything above the target moves it without changing its own layout — its
 * position inside its parent is unchanged — so there is no layout event to
 * listen for. Polling the window position sees all of it: a card appearing
 * above the target, a list growing, a query landing late.
 */
export function trackTourTarget(
  id: TourTargetId,
  from: TourRect,
  onMove: (rect: TourRect | null) => void,
): () => void {
  return trackMovement(
    () => measureNode(latest(nodes, id)),
    from,
    onMove,
    TRACK_POLL_MS,
  );
}
