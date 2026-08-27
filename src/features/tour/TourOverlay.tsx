import { useEffect, useRef, useState } from 'react';
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
import Svg, { Defs, Mask, Path, Rect } from 'react-native-svg';
import { Text } from '../../components/common/Text';
import MochiAside from '../../components/onboarding/MochiAside';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  arrowOffsetX,
  inflate,
  isOnScreen,
  placeCluster,
  type TourRect,
  type TourViewport,
} from './tourGeometry';
import { registerTourOverlay } from './tourOverlayPresence';
import {
  measureTourTarget,
  remeasureTourTarget,
  watchTourTargetLayout,
} from './tourTargets';
import { useCurrentTourStep, useTourStore } from './tourStore';
import { tourSteps, type TourStep, type TourTab } from './tourSteps';

const DESIRED_TOP = 220;
const MEASURE_SETTLE_MAX_MS = 650;
const MEASURE_TIMEOUT_MS = 1400;
const CLUSTER_HEIGHT = 170;
const ARROW_WIDTH = 40;
const ARROW_HEIGHT = 56;
const FOOTER_HEIGHT = 112;
const MIN_VISIBLE = 40;
const MAX_MEASURE_ATTEMPTS = 2;

interface TourOverlayProps {
  tab: TourTab;
}

interface PositionedRect {
  stepIndex: number;
  rect: TourRect;
}

interface MeasurementAttempt {
  stepIndex: number;
  count: number;
}

interface PresentedStep {
  step: TourStep;
  stepIndex: number;
}

export default function TourOverlay({ tab }: TourOverlayProps) {
  const step = useCurrentTourStep();
  const stepIndex = useTourStore((state) => state.stepIndex);
  const stop = useTourStore((state) => state.stop);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [positionedRect, setPositionedRect] = useState<PositionedRect | null>(null);
  const [attempt, setAttempt] = useState<MeasurementAttempt | null>(null);
  const [lastPresentedStep, setLastPresentedStep] = useState<PresentedStep | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const modalVisibleRef = useRef(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const clusterOpacity = useRef(new Animated.Value(0)).current;
  const measurementGenerationRef = useRef(0);
  const layoutGenerationRef = useRef(0);

  const isOnThisTab = step?.tab === tab;
  const hasActiveStep = step != null && stepIndex != null && isOnThisTab;
  const currentAttempt =
    stepIndex != null && attempt?.stepIndex === stepIndex ? attempt.count : 0;
  const viewport: TourViewport = {
    safeLeft: insets.left,
    safeRight: width - insets.right,
    safeTop: insets.top + spacing.sm,
    safeBottom: height - insets.bottom - FOOTER_HEIGHT,
  };
  const { safeLeft, safeRight, safeTop, safeBottom } = viewport;

  useEffect(() => {
    if (!hasActiveStep || step == null || stepIndex == null) return;
    setLastPresentedStep({ step, stepIndex });
    return registerTourOverlay(stepIndex);
  }, [hasActiveStep, step, stepIndex]);

  useEffect(() => {
    let frame: number | null = null;
    overlayOpacity.stopAnimation();

    if (hasActiveStep) {
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
  }, [hasActiveStep, overlayOpacity, reducedMotion]);

  useEffect(() => {
    if (!hasActiveStep || step == null || stepIndex == null) return;

    let isActive = true;
    const measuringIndex = stepIndex;
    const generation = measurementGenerationRef.current + 1;
    measurementGenerationRef.current = generation;

    void measureTourTarget(step.target, {
      desiredTop: DESIRED_TOP,
      settleMs: MEASURE_SETTLE_MAX_MS,
      timeoutMs: MEASURE_TIMEOUT_MS,
      animated: !reducedMotion,
    }).then((measured) => {
      if (
        !isActive ||
        generation !== measurementGenerationRef.current ||
        useTourStore.getState().stepIndex !== measuringIndex
      ) {
        return;
      }

      if (measured != null && isOnScreen(measured, viewport, MIN_VISIBLE)) {
        setPositionedRect({ stepIndex: measuringIndex, rect: measured });
        return;
      }
      if (currentAttempt + 1 < MAX_MEASURE_ATTEMPTS) {
        setAttempt({ stepIndex: measuringIndex, count: currentAttempt + 1 });
        return;
      }
      useTourStore.getState().next();
    });

    return () => {
      isActive = false;
    };
  }, [
    currentAttempt,
    hasActiveStep,
    reducedMotion,
    safeBottom,
    safeLeft,
    safeRight,
    safeTop,
    step,
    stepIndex,
  ]);

  useEffect(() => {
    if (!hasActiveStep || step == null || stepIndex == null) return;

    let isActive = true;
    const watchingIndex = stepIndex;
    layoutGenerationRef.current += 1;

    const unwatch = watchTourTargetLayout(step.target, () => {
      const generation = layoutGenerationRef.current + 1;
      layoutGenerationRef.current = generation;
      void remeasureTourTarget(step.target).then((measured) => {
        if (
          !isActive ||
          generation !== layoutGenerationRef.current ||
          useTourStore.getState().stepIndex !== watchingIndex ||
          measured == null
        ) {
          return;
        }

        if (isOnScreen(measured, viewport, MIN_VISIBLE)) {
          setPositionedRect({ stepIndex: watchingIndex, rect: measured });
        } else {
          setAttempt((current) => {
            const count = current?.stepIndex === watchingIndex ? current.count : 0;
            if (count >= MAX_MEASURE_ATTEMPTS - 1) return current;
            return { stepIndex: watchingIndex, count: count + 1 };
          });
        }
      });
    });

    return () => {
      isActive = false;
      layoutGenerationRef.current += 1;
      unwatch();
    };
  }, [hasActiveStep, safeBottom, safeLeft, safeRight, safeTop, step, stepIndex]);

  const presentedStep = hasActiveStep && step != null && stepIndex != null
    ? { step, stepIndex }
    : lastPresentedStep;
  const rect =
    presentedStep != null && positionedRect?.stepIndex === presentedStep.stepIndex
      ? positionedRect.rect
      : null;

  useEffect(() => {
    clusterOpacity.stopAnimation();
    if (rect == null) {
      clusterOpacity.setValue(0);
      return;
    }
    if (reducedMotion) {
      clusterOpacity.setValue(1);
      return;
    }
    Animated.timing(clusterOpacity, {
      toValue: 1,
      duration: duration.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return () => clusterOpacity.stopAnimation();
  }, [rect, clusterOpacity, reducedMotion]);

  useEffect(() => {
    if (!isModalVisible || !hasActiveStep || presentedStep == null) return;
    const { step: announcedStep, stepIndex: announcedIndex } = presentedStep;
    const id = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(
        `Step ${announcedIndex + 1} of ${tourSteps.length}: ${announcedStep.body}`,
      );
    }, 0);
    return () => clearTimeout(id);
  }, [
    hasActiveStep,
    isModalVisible,
    presentedStep?.step.body,
    presentedStep?.stepIndex,
  ]);

  if (!isModalVisible || presentedStep == null) return null;

  const hole = rect == null ? null : inflate(rect, spacing.sm);
  const placement =
    hole == null
      ? null
      : placeCluster(hole, viewport, CLUSTER_HEIGHT, spacing.sm);
  const isLast = presentedStep.stepIndex === tourSteps.length - 1;
  const clusterLeft = insets.left + spacing.lg;
  const clusterRight = insets.right + spacing.lg;
  const clusterWidth = Math.max(0, width - clusterLeft - clusterRight);
  const arrowLeft =
    hole == null
      ? 0
      : arrowOffsetX(hole, clusterLeft, clusterWidth, ARROW_WIDTH);
  const liveStepMatches =
    hasActiveStep && useTourStore.getState().stepIndex === presentedStep.stepIndex;

  const continueTour = () => {
    if (useTourStore.getState().stepIndex !== presentedStep.stepIndex) return;
    useTourStore.getState().next();
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
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={width} height={height}>
            <Defs>
              <Mask id="tourCutout">
                <Rect x={0} y={0} width={width} height={height} fill="white" />
                {hole == null ? null : (
                  <Rect
                    x={hole.x}
                    y={hole.y}
                    width={hole.width}
                    height={hole.height}
                    rx={radius.card}
                    ry={radius.card}
                    fill="black"
                  />
                )}
              </Mask>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill={colors.photoScrim.medium}
              mask="url(#tourCutout)"
            />
          </Svg>
        </View>

        {placement == null ? null : (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cluster,
              {
                left: clusterLeft,
                right: clusterRight,
                top: placement.top,
                height: placement.height,
                opacity: clusterOpacity,
              },
            ]}
          >
            {placement.pointsDown ? null : (
              <Arrow direction="up" left={arrowLeft} />
            )}
            <View style={styles.speech}>
              <MochiAside text={presentedStep.step.body} delayMs={0} />
            </View>
            {placement.pointsDown ? (
              <Arrow direction="down" left={arrowLeft} />
            ) : null}
          </Animated.View>
        )}

        <View
          style={[
            styles.footer,
            {
              left: clusterLeft,
              right: clusterRight,
              bottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <Pressable
            accessibilityLabel={isLast ? 'Finish tour' : 'Continue tour'}
            accessibilityRole="button"
            disabled={!liveStepMatches}
            onPress={continueTour}
            style={({ pressed }) => [
              styles.advancePill,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.advance}>{isLast ? 'Finish' : 'Continue'}</Text>
          </Pressable>
          <View style={styles.footerMeta}>
            <Text style={styles.counter}>
              {presentedStep.stepIndex + 1} of {tourSteps.length}
            </Text>
            <Pressable
              accessibilityLabel="Skip tour"
              accessibilityRole="button"
              disabled={!liveStepMatches}
              hitSlop={spacing.md}
              onPress={skipTour}
              style={({ pressed }) => pressed && styles.buttonPressed}
            >
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

function Arrow({ direction, left }: { direction: 'up' | 'down'; left: number }) {
  const isDown = direction === 'down';
  return (
    <Svg
      width={ARROW_WIDTH}
      height={ARROW_HEIGHT}
      viewBox="0 0 40 56"
      style={{ marginLeft: left }}
    >
      <Path
        d={isDown ? 'M20 4 C20 26, 20 34, 20 48' : 'M20 52 C20 30, 20 22, 20 8'}
        fill="none"
        stroke={colors.text.brand}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d={isDown ? 'M13 41 L20 50 L27 41' : 'M13 15 L20 6 L27 15'}
        fill="none"
        stroke={colors.text.brand}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  cluster: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  speech: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footer: {
    position: 'absolute',
    alignItems: 'center',
    gap: spacing.sm,
  },
  advancePill: {
    minWidth: 132,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.overlay.light,
  },
  advance: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  counter: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    opacity: 0.7,
  },
  skip: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  buttonPressed: { opacity: 0.7 },
});
