import { forwardRef, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../../components/common/Text';
import type { BreathingCircleRef } from '../../shared/components/BreathingCircle';
import BreathingCompanion from '../../shared/components/BreathingCompanion';
import type { BreathFace } from '../../shared/components/breathFaces';
import HeartRatePlacementStage, {
  PULSE_PREVIEW_RING,
  PULSE_PREVIEW_SIZE,
  pulsePreviewTop,
} from '../../shared/components/HeartRatePlacementStage';
import SessionHeartRateReadout from '../../shared/components/SessionHeartRateReadout';
import { SESSION_GLASS_BUTTON_SIZE } from '../../shared/components/SessionGlassButton';
import BreathHoldIntro, { type BreathHoldStep } from './BreathHoldIntro';
import HoldProgressBar, { formatHoldTime } from './HoldProgressBar';
import { HeartRateCameraPreview } from '../../../../components/heartRate/HeartRateCameraPreview';
import type { HeartRateCameraPreviewProps } from '../../../../components/heartRate/HeartRateCameraPreview';
import type {
  FingerPlacementState,
  SignalStatus,
} from '../../../../lib/heartRate/types';
import type { LiveSignalSource } from '../../../../lib/heartRate/liveSignalSource';
import {
  isBreathHoldBreathingPhase,
  type DailyBreathHoldPhase,
} from '../domain/breathHoldPhases';
import type { DailyBreathHoldProtocol } from '../domain/dailyBreathHoldProtocol';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { padding, spacing } from '../../../../theme/spacing';
import { fonts, typography } from '../../../../theme/typography';

export const DAILY_BREATH_HOLD_INTRO_DURATION_MS = 750;
// Beat between the intro copy clearing and the first inhale, so the character
// has arrived and settled before it asks anything of you.
export const DAILY_BREATH_HOLD_SETTLE_MS = 500;

const INTRO_TITLE = 'Daily Breath Hold';

const HEADLINE_AREA_HEIGHT = 104;
// Clears the glass buttons sitting in the scaffold header.
const TOP_CLEARANCE =
  padding.screen.vertical + SESSION_GLASS_BUTTON_SIZE + spacing.lg;

const HOLD_SUBLINE = 'Hold as long as you can';
const HOLD_CUE = 'Tap the screen to stop when you need to breathe.';

const PHASE_FACES: Record<DailyBreathHoldPhase, BreathFace> = {
  idle: 'resting',
  intro: 'resting',
  placement: 'resting',
  preInhale: 'inhale',
  preExhale: 'exhale',
  inhale: 'inhale',
  hold: 'holdIn',
  processingResults: 'resting',
};

type DailyBreathHoldCamera = Pick<
  HeartRateCameraPreviewProps,
  'device' | 'format' | 'frameProcessor' | 'torchMode'
>;

interface DailyBreathHoldHeartRatePresentation {
  enabled: boolean;
  active: boolean;
  bpm: number | null;
  beatTick: number;
  signalSource: LiveSignalSource;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  camera?: DailyBreathHoldCamera;
}

interface DailyBreathHoldPresentationProps {
  phase: DailyBreathHoldPhase;
  theme: ExerciseDarkTheme;
  protocol: DailyBreathHoldProtocol;
  prepCycle: number;
  holdSeconds: number;
  bestHoldSeconds: number;
  heartRate: DailyBreathHoldHeartRatePresentation;
}

export const DailyBreathHoldPresentation = forwardRef<
  BreathingCircleRef,
  DailyBreathHoldPresentationProps
>(function DailyBreathHoldPresentation(
  {
    phase,
    theme,
    protocol,
    prepCycle,
    holdSeconds,
    bestHoldSeconds,
    heartRate,
  },
  companionRef,
) {
  const isIdle = phase === 'idle';
  const isPlacement = phase === 'placement';
  const isHold = phase === 'hold';
  const isLive = isBreathHoldBreathingPhase(phase) || isHold;

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const viewport = height - insets.top;
  const reducedMotion = useReducedMotion();
  const measuringPulse = heartRate.enabled && heartRate.active && isPlacement;
  const trackingPulse = heartRate.enabled && heartRate.active && isLive;

  const { prepCycles, prepExhaleSeconds, prepInhaleSeconds } = protocol;
  const introDescription =
    `Take ${prepCycles} slow breaths, one last deep inhale, then hold as long as you ` +
    `comfortably can. Tap to release. Builds CO₂ tolerance, calms your nervous system, and ` +
    `strengthens lung capacity. Over time it trains a steadier, more resilient breath.`;
  const introSteps = useMemo<BreathHoldStep[]>(
    () => [
      { icon: 'arrow-up-bold', value: `${prepInhaleSeconds}s`, label: 'Inhale' },
      { icon: 'arrow-down-bold', value: `${prepExhaleSeconds}s`, label: 'Exhale' },
      { icon: 'pause', value: 'Max', label: 'Hold' },
    ],
    [prepExhaleSeconds, prepInhaleSeconds],
  );

  const transition = useRef(new Animated.Value(isIdle ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: isIdle ? 0 : 1,
      duration: DAILY_BREATH_HOLD_INTRO_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isIdle, transition]);

  const introOpacity = transition.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.4, 0],
  });
  const introTranslateY = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });
  const headlineOpacity = transition.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.3, 1],
  });

  const camera = heartRate.camera;

  const headline = isHold
    ? formatHoldTime(holdSeconds)
    : phase === 'preExhale'
      ? 'Exhale'
      : phase === 'preInhale' || phase === 'inhale'
        ? 'Inhale'
        : '';
  const subline = isHold
    ? HOLD_SUBLINE
    : phase === 'inhale'
      ? 'Last breath in'
      : isBreathHoldBreathingPhase(phase) && prepCycle > 0
        ? `Breath ${prepCycle} of ${prepCycles}`
        : '';

  return (
    <View style={styles.stage} pointerEvents="box-none">
      <BreathingCompanion
        ref={companionRef}
        face={PHASE_FACES[phase]}
        theme={theme}
        reducedMotion={reducedMotion}
        visible={!isIdle && !isPlacement}
      />

      <Animated.View
        style={[
          styles.introLayer,
          { opacity: introOpacity, transform: [{ translateY: introTranslateY }] },
        ]}
        pointerEvents="none"
      >
        <BreathHoldIntro
          title={INTRO_TITLE}
          description={introDescription}
          steps={introSteps}
          textColors={{
            primary: theme.textPrimary,
            secondary: theme.textSecondary,
            tertiary: theme.textTertiary,
            accent: theme.textAccent,
          }}
        />
      </Animated.View>

      <View style={styles.topBlock} pointerEvents="none">
        <Animated.View style={{ opacity: headlineOpacity }}>
          <View style={styles.headlineArea}>
            <View style={styles.headlineLayer}>
              {headline ? (
                <Text
                  style={[
                    styles.headline,
                    isHold && styles.headlineTimer,
                    { color: theme.textPrimary },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  maxFontSizeMultiplier={1.2}
                >
                  {headline}
                </Text>
              ) : null}
            </View>
          </View>

          {isHold ? (
            <View style={styles.progressArea}>
              <HoldProgressBar
                holdSeconds={holdSeconds}
                bestSeconds={bestHoldSeconds}
                trackColor={theme.surface}
                fillColor={theme.textAccent}
              />
            </View>
          ) : null}

          {subline ? (
            <Text style={[styles.subline, { color: theme.textSecondary }]}>
              {subline}
            </Text>
          ) : null}

          {isHold ? (
            <Text style={[styles.cue, { color: theme.textTertiary }]}>
              {HOLD_CUE}
            </Text>
          ) : null}
        </Animated.View>
      </View>

      {measuringPulse ? (
        <HeartRatePlacementStage
          theme={theme}
          viewport={viewport}
          bpm={heartRate.bpm}
          beatTick={heartRate.beatTick}
          signalSource={heartRate.signalSource}
          fingerPlacement={heartRate.fingerPlacement}
          signalStatus={heartRate.signalStatus}
        />
      ) : null}

      {/* One mount across both phases. Re-rendering this into a different slot
          would tear down the capture session and drop the pulse lock the
          placement flow just earned. */}
      {camera && (measuringPulse || trackingPulse) ? (
        <View
          style={
            measuringPulse
              ? [
                  styles.pulsePreview,
                  {
                    top: pulsePreviewTop(viewport),
                    backgroundColor: theme.circleInner,
                    borderColor: theme.circleOutline,
                  },
                ]
              : styles.hiddenCamera
          }
          pointerEvents="none"
        >
          <HeartRateCameraPreview
            {...camera}
            fingerPlacement={heartRate.fingerPlacement}
            isActive={heartRate.active}
          />
        </View>
      ) : null}

      {trackingPulse ? (
        <View
          style={[styles.readout, { bottom: insets.bottom + spacing.lg }]}
          pointerEvents="none"
        >
          <SessionHeartRateReadout
            theme={theme}
            bpm={heartRate.bpm}
            fingerPlacement={heartRate.fingerPlacement}
            signalStatus={heartRate.signalStatus}
          />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
  },
  topBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: TOP_CLEARANCE,
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'stretch',
  },
  // Takes the slot the progress bar used to hold, riding over the character's
  // body where the breath motion is quietest.
  readout: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pulsePreview: {
    position: 'absolute',
    alignSelf: 'center',
    width: PULSE_PREVIEW_SIZE,
    height: PULSE_PREVIEW_SIZE,
    borderRadius: PULSE_PREVIEW_SIZE / 2,
    borderWidth: PULSE_PREVIEW_RING,
    overflow: 'hidden',
  },
  // Transparent and behind the character: kept only so frames keep reaching the
  // pulse processor once the preview has served its purpose.
  hiddenCamera: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 64,
    height: 64,
    opacity: 0,
  },
  introLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
  // Fixed height so the layout does not shift as the phase label swaps.
  headlineArea: {
    alignSelf: 'stretch',
    height: HEADLINE_AREA_HEIGHT,
    justifyContent: 'center',
  },
  headlineLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    ...typography.display.display1,
    textAlign: 'center',
  },
  headlineTimer: {
    fontVariant: ['tabular-nums'],
  },
  progressArea: {
    marginBottom: spacing.xs,
  },
  subline: {
    ...typography.body.medium,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  cue: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
});
