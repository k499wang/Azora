import { useEffect, useLayoutEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/spacing';
import { inflate, type TourRect, type TourViewport } from './tourGeometry';
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
  TourCluster,
  TourCounter,
  TourCutout,
  TourSkipButton,
} from './TourSpotlight';

const DESIRED_TOP = 260;
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
 * Nothing is drawn until a stop has been placed. An unplaced stop must not put
 * a scrim up: it would cover the very control it is about to point at.
 */
export default function FirstSessionActivationOverlay() {
  const phase = useFirstSessionActivationStore((state) => state.phase);
  const followsTour = useFirstSessionActivationStore((state) => state.followsTour);
  const stop = activationStopFor(phase);
  const rect = useStopPlacement(stop);

  // Android back is the way out of a run, the same as the Skip control, rather
  // than a press that does nothing.
  useEffect(() => {
    if (stop == null) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      useFirstSessionActivationStore.getState().skip();
      return true;
    });
    return () => subscription.remove();
  }, [stop]);

  if (stop == null || rect == null) return null;

  return (
    <PlacedStop
      stop={stop}
      hole={inflate(rect, spacing.sm)}
      showCounter={followsTour}
    />
  );
}

interface PlacedStopProps {
  stop: ActivationStop;
  hole: TourRect;
  showCounter: boolean;
}

function PlacedStop({ stop, hole, showCounter }: PlacedStopProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const clusterLeft = insets.left + spacing.lg;
  const clusterRight = insets.right + spacing.lg;
  const clusterViewport: TourViewport = {
    safeLeft: insets.left,
    safeRight: width - insets.right,
    safeTop: insets.top + TOP_CONTROL_HEIGHT,
    safeBottom: height - insets.bottom - BOTTOM_META_HEIGHT,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TourCutout maskId="activationCutout" width={width} height={height} hole={hole} />

      {stop.interaction === 'press-through' ? (
        <PressThroughBlockers hole={hole} />
      ) : (
        <Pressable
          accessibilityHint="Closes this message"
          accessibilityLabel={stop.body}
          accessibilityRole="button"
          onPress={() => useFirstSessionActivationStore.getState().finish()}
          style={StyleSheet.absoluteFill}
        />
      )}

      <TourCluster
        hole={hole}
        viewport={clusterViewport}
        body={stop.body}
        left={clusterLeft}
        right={clusterRight}
        width={Math.max(0, width - clusterLeft - clusterRight)}
      />

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
    </View>
  );
}

/** Leaves only the real highlighted control interactive. */
function PressThroughBlockers({ hole }: { hole: TourRect }) {
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
  const [rect, setRect] = useState<TourRect | null>(null);
  const target = stop?.target ?? null;

  useLayoutEffect(() => {
    setRect(null);
    if (target == null) return;

    let active = true;
    let retryId: ReturnType<typeof setTimeout> | null = null;
    let giveUpId: ReturnType<typeof setTimeout> | null = null;
    let untrack: (() => void) | null = null;

    // Armed whenever there is nothing on screen — including after a placed
    // element is lost again — so no state of this loop can run unbounded.
    const armGiveUp = () => {
      if (giveUpId != null) clearTimeout(giveUpId);
      giveUpId = setTimeout(() => {
        if (active) useFirstSessionActivationStore.getState().abandon();
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
        desiredTop: DESIRED_TOP,
        settleMs: MEASURE_SETTLE_MAX_MS,
        timeoutMs: MEASURE_TIMEOUT_MS,
        animated: true,
      }).then((measured) => {
        if (!active) return;
        if (measured == null) {
          retryId = setTimeout(place, RETRY_MS);
          return;
        }
        disarmGiveUp();
        setRect(measured);
        // The screen underneath keeps working, so follow the element rather
        // than leaving the cutout where it first landed.
        untrack = trackTourTarget(target, measured, (moved) => {
          if (!active) return;
          if (moved != null) {
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
      disarmGiveUp();
      if (retryId != null) clearTimeout(retryId);
      untrack?.();
    };
    // Remeasured on rotation: the element moves without its own layout changing.
  }, [height, target, width]);

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
