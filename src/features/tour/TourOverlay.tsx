import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { duration } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import {
  inflate,
  isOnScreen,
  type TourRect,
  type TourViewport,
} from './tourGeometry';
import { registerTourOverlay } from './tourOverlayPresence';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { measureTourTarget, pressTourTarget, trackTourTarget } from './tourTargets';
import { useCurrentTourStep, useTourStore } from './tourStore';
import { tourSteps, type TourStep } from './tourSteps';
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
/**
 * Long enough to outlast a cold Home: the room block sizing itself, the
 * progress card arriving, the dailies list swapping its skeleton for rows and
 * then laying those rows out a second time. Nothing is on screen while this
 * runs — the overlay does not appear until a stop has actually been placed —
 * so waiting costs the user nothing, and giving up early cost them the tour.
 */
const MEASURE_TIMEOUT_MS = 5000;
const MIN_VISIBLE = 40;
const MAX_MEASURE_ATTEMPTS = 2;

interface PositionedRect {
  stepIndex: number;
  rect: TourRect;
}

interface PresentedStep {
  step: TourStep;
  stepIndex: number;
}

export default function TourOverlay() {
  const status = useTourStore((state) => state.status);
  const step = useCurrentTourStep();
  const stepIndex = useTourStore((state) => state.stepIndex);
  const stop = useTourStore((state) => state.stop);
  const completeClosing = useTourStore((state) => state.completeClosing);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const totalStops = tourSteps.length;
  const [positionedRect, setPositionedRect] = useState<PositionedRect | null>(null);
  const [hasPlacedAnyStep, setHasPlacedAnyStep] = useState(false);
  const [lastPresentedStep, setLastPresentedStep] = useState<PresentedStep | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const modalVisibleRef = useRef(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const hasActiveStep = step != null && stepIndex != null;
  /**
   * The overlay stays away until the first stop is actually placed.
   *
   * Showing the scrim the moment a step became active put a dark screen with
   * no Azo, no bubble and no arrow in front of the user for however long the
   * measurement took — and over the intro splash, when the tour had started
   * behind it. Once a stop has been placed the overlay stays up for the rest of
   * the run, so the gap between two stops is not a flash of the app.
   */
  const shouldShowOverlay = hasActiveStep && hasPlacedAnyStep;
  const measurementViewport: TourViewport = {
    safeLeft: insets.left,
    safeRight: width - insets.right,
    safeTop: insets.top,
    safeBottom: height - insets.bottom,
  };
  const clusterViewport: TourViewport = {
    ...measurementViewport,
    safeTop: insets.top + TOP_CONTROL_HEIGHT,
    safeBottom: height - insets.bottom - BOTTOM_META_HEIGHT,
  };
  const { safeLeft, safeRight, safeTop, safeBottom } = measurementViewport;

  // Register the active step so the app-level watchdog can recover if this
  // overlay never mounts for it.
  useEffect(() => {
    if (!hasActiveStep || step == null || stepIndex == null) return;
    setLastPresentedStep({ step, stepIndex });
    return registerTourOverlay(stepIndex);
  }, [hasActiveStep, step, stepIndex]);

  // Own the native Modal lifecycle here. Post-tour presenters remain blocked
  // while the store is `closing` and this fade is still on screen.
  useEffect(() => {
    let frame: number | null = null;
    overlayOpacity.stopAnimation();

    if (shouldShowOverlay) {
      modalVisibleRef.current = true;
      setIsModalVisible(true);
      if (reducedMotion) {
        overlayOpacity.setValue(1);
      } else {
        overlayOpacity.setValue(0);
        frame = requestAnimationFrame(() => {
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: duration.fast,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        });
      }
    } else if (modalVisibleRef.current) {
      const finishExit = () => {
        modalVisibleRef.current = false;
        setIsModalVisible(false);
        setLastPresentedStep(null);
        setPositionedRect(null);
        setHasPlacedAnyStep(false);
      };
      if (reducedMotion) {
        overlayOpacity.setValue(0);
        finishExit();
      } else {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: duration.fast,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) finishExit();
        });
      }
    }

    return () => {
      if (frame != null) cancelAnimationFrame(frame);
      overlayOpacity.stopAnimation();
    };
  }, [overlayOpacity, reducedMotion, shouldShowOverlay]);

  // Acknowledge closing on the next frame, after React has committed the
  // invisible Modal. This is the only normal path to `finished`.
  useEffect(() => {
    if (status !== 'closing' || isModalVisible) return;

    const frame = requestAnimationFrame(() => {
      const live = useTourStore.getState();
      if (!modalVisibleRef.current && live.status === 'closing') {
        completeClosing();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [completeClosing, isModalVisible, status]);

  // Place one target, then follow it, as a single lifecycle. Keeping one owner
  // prevents a tracked move from racing the settled measure it came out of.
  useLayoutEffect(() => {
    if (!hasActiveStep || step == null || stepIndex == null) return;

    let isActive = true;
    const measuringIndex = stepIndex;
    const controller = new AbortController();
    let untrack: (() => void) | null = null;

    const isCurrentStep = () =>
      isActive && useTourStore.getState().stepIndex === measuringIndex;

    const clearCurrentRect = () => {
      setPositionedRect((current) =>
        current?.stepIndex === measuringIndex ? null : current,
      );
    };

    const stopTracking = () => {
      if (untrack == null) return;
      const stop = untrack;
      untrack = null;
      stop();
    };

    const place = async (): Promise<TourRect | null> => {
      for (let tries = 0; tries < MAX_MEASURE_ATTEMPTS; tries += 1) {
        const measured = await measureTourTarget(step.target, {
          desiredTop: TOUR_DESIRED_TOP,
          settleMs: MEASURE_SETTLE_MAX_MS,
          timeoutMs: MEASURE_TIMEOUT_MS,
          animated: !reducedMotion,
          signal: controller.signal,
        });
        if (!isCurrentStep()) return null;

        if (
          measured != null &&
          isOnScreen(measured, measurementViewport, MIN_VISIBLE)
        ) {
          setPositionedRect({ stepIndex: measuringIndex, rect: measured });
          setHasPlacedAnyStep(true);
          return measured;
        }
        clearCurrentRect();
      }
      return null;
    };

    const follow = (from: TourRect) => {
      untrack = trackTourTarget(step.target, from, (moved) => {
        if (untrack == null || !isCurrentStep()) return;

        if (moved != null && isOnScreen(moved, measurementViewport, MIN_VISIBLE)) {
          setPositionedRect({ stepIndex: measuringIndex, rect: moved });
          return;
        }

        // Something above it grew enough to push it off screen. Scroll it back
        // rather than dropping a stop the user is looking at.
        stopTracking();
        clearCurrentRect();
        void run();
      });
    };

    const run = async () => {
      const placed = await place();
      if (!isCurrentStep()) return;
      if (placed == null) {
        // The press stop ends the tour, and every stop before it was seen, so
        // one that cannot be placed — no lesson today — finishes the tour.
        if (step.finishOn === 'press') {
          useTourStore.getState().next();
          return;
        }
        // Never advance past any other stop that could not be placed: `next`
        // walks the tour to its end and calls `stop`, which marks the whole
        // thing seen.
        useTourStore.getState().abort();
        return;
      }
      follow(placed);
    };

    // A viewport change must not leave old geometry on screen while the new
    // settled measurement is pending. Preserve other steps for exit.
    clearCurrentRect();
    void run();

    return () => {
      isActive = false;
      stopTracking();
      controller.abort();
    };
  }, [
    hasActiveStep,
    reducedMotion,
    safeBottom,
    safeLeft,
    safeRight,
    safeTop,
    step,
    stepIndex,
  ]);

  const presentedStep = hasActiveStep && step != null && stepIndex != null
    ? { step, stepIndex }
    : lastPresentedStep;
  const rect =
    presentedStep != null && positionedRect?.stepIndex === presentedStep.stepIndex
      ? positionedRect.rect
      : null;
  const clusterOpacity = useTourFadeIn(rect != null);
  const canContinue =
    rect != null &&
    hasActiveStep &&
    presentedStep != null &&
    useTourStore.getState().stepIndex === presentedStep.stepIndex;

  useEffect(() => {
    if (!isModalVisible || !canContinue || presentedStep == null) return;
    const { step: announcedStep, stepIndex: announcedIndex } = presentedStep;
    const id = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(
        `Step ${announcedIndex + 1} of ${totalStops}: ${announcedStep.body}`,
      );
    }, 0);
    return () => clearTimeout(id);
  }, [
    canContinue,
    isModalVisible,
    presentedStep?.step.body,
    presentedStep?.stepIndex,
    totalStops,
  ]);

  if (!isModalVisible || presentedStep == null) return null;

  const hole = rect == null ? null : inflate(rect, TOUR_HOLE_PADDING);
  const isLast = presentedStep.stepIndex === totalStops - 1;
  const clusterLeft = insets.left + spacing.lg;
  const clusterRight = insets.right + spacing.lg;
  const clusterWidth = Math.max(0, width - clusterLeft - clusterRight);
  const finishesOnPress = presentedStep.step.finishOn === 'press';
  const continueTour = () => {
    if (!canContinue || finishesOnPress) return;
    if (useTourStore.getState().stepIndex !== presentedStep.stepIndex) return;
    useTourStore.getState().next();
  };
  /**
   * The control under the hole, pressed. Its own action runs — the screen it
   * opens slides in under this Modal, which fades off it — so there is no
   * moment between the tour and what the user asked for.
   */
  const pressStop = () => {
    if (!canContinue) return;
    const live = useTourStore.getState();
    // The step only clears once the seen flag is written, so a quick second
    // tap would otherwise run the action — and open the screen — twice.
    if (live.handedOff || live.stepIndex !== presentedStep.stepIndex) return;
    triggerTapHaptic();
    if (pressTourTarget(presentedStep.step.target)) {
      useTourStore.getState().finishByPress();
    } else {
      useTourStore.getState().next();
    }
  };
  const skipTour = () => {
    if (useTourStore.getState().stepIndex !== presentedStep.stepIndex) return;
    void stop();
  };

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent
      onRequestClose={skipTour}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible
    >
      <Animated.View
        accessibilityViewIsModal
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <Pressable
          accessible={false}
          disabled={!canContinue || finishesOnPress}
          onPress={continueTour}
          style={StyleSheet.absoluteFill}
        >
          <TourCutout maskId="tourCutout" width={width} height={height} hole={hole} />
        </Pressable>

        {finishesOnPress && canContinue && hole != null ? (
          <Pressable
            accessibilityHint={presentedStep.step.body}
            accessibilityLabel="Start"
            accessibilityRole="button"
            onPress={pressStop}
            style={[
              styles.pressHole,
              { left: hole.x, top: hole.y, width: hole.width, height: hole.height },
            ]}
          />
        ) : null}

        {hole == null ? null : (
          <TourCluster
            hole={hole}
            viewport={clusterViewport}
            body={presentedStep.step.body}
            left={clusterLeft}
            right={clusterRight}
            width={clusterWidth}
            opacity={clusterOpacity}
          />
        )}

        {canContinue && !finishesOnPress ? (
          <TourTopHint
            label={isLast ? 'Tap anywhere to finish' : 'Tap anywhere to continue'}
            onPress={continueTour}
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
          <TourCounter index={presentedStep.stepIndex} total={totalStops} />
          <TourSkipButton disabled={!hasActiveStep} onPress={skipTour} />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  pressHole: { position: 'absolute' },
  bottomMeta: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
});
