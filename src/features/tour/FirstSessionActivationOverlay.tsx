import { useEffect, useLayoutEffect, useState } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { spacing } from '../../theme/spacing';
import { inflate, isOnScreen, type TourRect, type TourViewport } from './tourGeometry';
import { measureTourTarget, trackTourTarget } from './tourTargets';
import { useFirstSessionActivationStore } from './firstSessionActivationStore';
import {
  activationStopFor,
  activationStopNumber,
  TOTAL_TOUR_STOPS,
  type ActivationStop,
} from './activationStops';
import {
  BOTTOM_META_HEIGHT,
  TOP_CONTROL_HEIGHT,
  TOUR_DESIRED_TOP,
  TOUR_HOLE_PADDING,
  TourCluster,
  TourCounter,
  TourCutout,
  TourSkipButton,
  TourTopHint,
  useTourFadeIn,
} from './TourSpotlight';

const MEASURE_SETTLE_MAX_MS = 1200;
const MEASURE_TIMEOUT_MS = 5000;
const RETRY_MS = 250;
/**
 * How long a stop may go unplaced before the run stands down.
 *
 * Long enough to outlast a screen transition and a cold list several times
 * over. Past it the element is not coming — it is behind a query that failed,
 * or a row that is not rendered for this user — and everything that waits for
 * the first session to end would wait forever.
 */
const PLACEMENT_TIMEOUT_MS = 20000;

/**
 * The first session's stops, drawn over the live app rather than in the tour's
 * Modal so the user can reach the real control through the cutout.
 *
 * The chrome and the entrance come from `TourSpotlight`: the same fade, the
 * same hole, the same scroll position as the informational stops. Only the
 * mounting differs, and the user should not be able to tell which presenter
 * they are looking at.
 *
 * The first stop of the run draws nothing until it has been placed — a scrim
 * over the control it is about to point at is the app looking broken. From
 * then on the scrim stays up between consecutive stops, so walking from Home
 * to the session screen is one continuous coach mark rather than a flash of
 * bare app.
 */
export default function FirstSessionActivationOverlay() {
  const phase = useFirstSessionActivationStore((state) => state.phase);
  const followsTour = useFirstSessionActivationStore((state) => state.followsTour);
  const held = useFirstSessionActivationStore((state) => state.heldForTransition);
  const stop = activationStopFor(phase);
  // Measured while the screen above it closes, so it is ready to draw the
  // instant that screen is gone. `held` is what keeps it off the closing one.
  const rect = useStopPlacement(stop);
  const scrimStaysUp = useScrimBetweenStops(stop, rect);
  const visible = stop != null && !held && (rect != null || scrimStaysUp);

  // Android back is the way out, the same as the Skip control, rather than a
  // press that does nothing.
  useEffect(() => {
    if (stop == null) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      useFirstSessionActivationStore.getState().skip();
      return true;
    });
    return () => subscription.remove();
  }, [stop]);

  if (!visible || stop == null) return null;

  return (
    <PlacedStop
      stop={stop}
      hole={rect == null ? null : inflate(rect, TOUR_HOLE_PADDING)}
      showCounter={followsTour}
    />
  );
}

/**
 * Whether the scrim holds while the next stop is being placed.
 *
 * True only between two stops that follow each other directly — tapping play
 * on Home and arriving at the session screen. Leaving the stops at all (the
 * Reset itself, the wait for the result screen) puts it back to nothing, so
 * the next stop still arrives on a clean screen rather than from behind a
 * scrim that has been sitting there with nobody on it.
 */
function useScrimBetweenStops(
  stop: ActivationStop | null,
  rect: TourRect | null,
): boolean {
  const [staysUp, setStaysUp] = useState(false);

  useEffect(() => {
    if (stop == null) setStaysUp(false);
    else if (rect != null) setStaysUp(true);
  }, [rect, stop]);

  return staysUp;
}

interface PlacedStopProps {
  stop: ActivationStop;
  /** null while the next stop is still being measured behind the scrim */
  hole: TourRect | null;
  showCounter: boolean;
}

function PlacedStop({ stop, hole, showCounter }: PlacedStopProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const opacity = useTourFadeIn(true);
  const clusterOpacity = useTourFadeIn(hole != null);
  const clusterLeft = insets.left + spacing.lg;
  const clusterRight = insets.right + spacing.lg;
  const clusterViewport: TourViewport = {
    safeLeft: insets.left,
    safeRight: width - insets.right,
    safeTop: insets.top + TOP_CONTROL_HEIGHT,
    safeBottom: height - insets.bottom - BOTTOM_META_HEIGHT,
  };

  const dismissable = hole != null && stop.interaction === 'dismiss';
  const dismiss = () => useFirstSessionActivationStore.getState().finish();

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity }]}
      pointerEvents="box-none"
    >
      <TourCutout maskId="activationCutout" width={width} height={height} hole={hole} />

      {dismissable ? (
        <Pressable
          accessibilityHint="Closes this message"
          accessibilityLabel={stop.body}
          accessibilityRole="button"
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        // Nothing but the highlighted control, and nothing at all until there
        // is one: a stop still being measured must not pass taps through to a
        // screen the user cannot see.
        <PressThroughBlockers hole={hole} />
      )}

      {hole == null ? null : (
        <TourCluster
          hole={hole}
          viewport={clusterViewport}
          body={stop.body}
          left={clusterLeft}
          right={clusterRight}
          width={Math.max(0, width - clusterLeft - clusterRight)}
          opacity={clusterOpacity}
        />
      )}

      {dismissable ? (
        <TourTopHint
          label="Tap anywhere to finish"
          onPress={dismiss}
          left={clusterLeft}
          right={clusterRight}
          top={insets.top + spacing.sm}
        />
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          styles.bottomMeta,
          {
            left: clusterLeft,
            right: clusterRight,
            bottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        {showCounter ? (
          <TourCounter index={activationStopNumber(stop)} total={TOTAL_TOUR_STOPS} />
        ) : null}
        {/* The last stop is already a tap-anywhere dismissal, so it needs no
            second way out. */}
        {stop.interaction === 'press-through' ? (
          <TourSkipButton
            onPress={() => useFirstSessionActivationStore.getState().skip()}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Leaves only the real highlighted control interactive. */
function PressThroughBlockers({ hole }: { hole: TourRect | null }) {
  if (hole == null) {
    return <Pressable onPress={() => {}} style={StyleSheet.absoluteFill} />;
  }

  return (
    <>
      <Pressable onPress={() => {}} style={[styles.blocker, { left: 0, top: 0, right: 0, height: hole.y }]} />
      <Pressable onPress={() => {}} style={[styles.blocker, { left: 0, top: hole.y, width: hole.x, height: hole.height }]} />
      <Pressable onPress={() => {}} style={[styles.blocker, { left: hole.x + hole.width, top: hole.y, right: 0, height: hole.height }]} />
      <Pressable onPress={() => {}} style={[styles.blocker, { left: 0, top: hole.y + hole.height, right: 0, bottom: 0 }]} />
    </>
  );
}

/**
 * Where the stop's element is, once it has held still, and for as long as it
 * keeps showing. Null until then, and the run stands down if it never lands.
 *
 * The element is usually on a screen that is still arriving, so a first
 * measurement finding nothing is the normal case, not a failure.
 */
function useStopPlacement(stop: ActivationStop | null): TourRect | null {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [rect, setRect] = useState<TourRect | null>(null);
  const target = stop?.target ?? null;

  useLayoutEffect(() => {
    setRect(null);
    if (target == null) return;

    let active = true;
    const controller = new AbortController();
    const viewport: TourViewport = {
      safeLeft: insets.left,
      safeRight: width - insets.right,
      safeTop: insets.top,
      safeBottom: height - insets.bottom,
    };
    let retryId: ReturnType<typeof setTimeout> | null = null;
    let giveUpId: ReturnType<typeof setTimeout> | null = null;
    let untrack: (() => void) | null = null;

    // Armed whenever there is nothing on screen — including after a placed
    // element is lost again — so no state of this loop can run unbounded.
    const armGiveUp = () => {
      if (giveUpId != null) return;
      giveUpId = setTimeout(() => {
        if (!active) return;
        active = false;
        controller.abort();
        if (retryId != null) clearTimeout(retryId);
        untrack?.();
        useFirstSessionActivationStore.getState().abandon();
      }, PLACEMENT_TIMEOUT_MS);
    };

    const disarmGiveUp = () => {
      if (giveUpId == null) return;
      clearTimeout(giveUpId);
      giveUpId = null;
    };

    const place = () => {
      armGiveUp();
      void measureTourTarget(target, {
        desiredTop: TOUR_DESIRED_TOP,
        settleMs: MEASURE_SETTLE_MAX_MS,
        timeoutMs: MEASURE_TIMEOUT_MS,
        animated: !reducedMotion,
        signal: controller.signal,
      }).then((measured) => {
        if (!active) return;
        if (measured == null || !isOnScreen(measured, viewport, 40)) {
          retryId = setTimeout(place, RETRY_MS);
          return;
        }
        disarmGiveUp();
        setRect(measured);
        // The screen underneath keeps working, so follow the element rather
        // than leaving the cutout where it first landed.
        untrack = trackTourTarget(target, measured, (moved) => {
          if (!active) return;
          if (moved != null && isOnScreen(moved, viewport, 40)) {
            setRect(moved);
            return;
          }
          untrack?.();
          untrack = null;
          setRect(null);
          place();
        });
      });
    };
    place();

    return () => {
      active = false;
      controller.abort();
      disarmGiveUp();
      if (retryId != null) clearTimeout(retryId);
      untrack?.();
    };
    // Remeasured on rotation: the element moves without its own layout changing.
  }, [height, insets.bottom, insets.left, insets.right, insets.top, reducedMotion, target, width]);

  return rect;
}

const styles = StyleSheet.create({
  blocker: {
    position: 'absolute',
  },
  bottomMeta: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
});
