import { Text } from '../../../../components/common/Text';
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReducedMotion } from 'react-native-reanimated';
import type { BreathingCircleRef } from '../../shared/components/BreathingCircle';
import type { BreathFace } from '../../shared/components/breathFaces';
import BreathingCompanion from '../../shared/components/BreathingCompanion';
import TechniqueIntro from './TechniqueIntro';
import { HeartRateCameraPreview } from '../../../../components/heartRate/HeartRateCameraPreview';
import type { HeartRateCameraPreviewProps } from '../../../../components/heartRate/HeartRateCameraPreview';
import HeartRatePlacementStage, {
  PULSE_PREVIEW_RING,
  PULSE_PREVIEW_SIZE,
  pulsePreviewTop,
} from '../../shared/components/HeartRatePlacementStage';
import { usePlacementFade } from '../../shared/hooks/usePlacementFade';
import { usePhaseCrossfade } from '../../shared/hooks/usePhaseCrossfade';
import SessionHeartRateReadout from '../../shared/components/SessionHeartRateReadout';
import type { BreathingTechnique } from '../techniques';
import type { BreathingPhase } from '../domain/breathingSessionTiming';
import type {
  FingerPlacementState,
  SignalStatus,
} from '../../../../lib/heartRate/types';
import type { LiveSignalSource } from '../../../../lib/heartRate/liveSignalSource';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SESSION_GLASS_BUTTON_SIZE } from '../../shared/components/SessionGlassButton';
import { padding, spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

export const GUIDED_BREATHING_INTRO_DURATION_MS = 750;
// Beat between the technique copy clearing the screen and the first inhale, so
// the character has arrived and settled before it asks anything of you.
export const GUIDED_BREATHING_SETTLE_MS = 500;
// The full beat between the character arriving and the first cue, shared by
// every way into the session.
export const GUIDED_BREATHING_LEAD_IN_MS =
  GUIDED_BREATHING_INTRO_DURATION_MS + GUIDED_BREATHING_SETTLE_MS;

const HEADLINE_AREA_HEIGHT = 104;
// Clears the glass buttons sitting in the scaffold header.
const TOP_CLEARANCE =
  padding.screen.vertical + SESSION_GLASS_BUTTON_SIZE + spacing.lg;

export type GuidedBreathingPhase =
  | BreathingPhase
  | 'idle'
  | 'intro'
  | 'placement'
  | 'done';

type GuidedBreathingCamera = Pick<
  HeartRateCameraPreviewProps,
  'device' | 'format' | 'frameProcessor' | 'torchMode'
>;

interface GuidedBreathingHeartRatePresentation {
  enabled: boolean;
  active: boolean;
  bpm: number | null;
  beatTick: number;
  signalSource: LiveSignalSource;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  camera?: GuidedBreathingCamera;
}

interface GuidedBreathingPresentationProps {
  active: boolean;
  phase: GuidedBreathingPhase;
  technique: BreathingTechnique;
  theme: ExerciseDarkTheme;
  remainingSeconds: number;
  heartRate: GuidedBreathingHeartRatePresentation;
}

const PHASE_LABELS: Record<GuidedBreathingPhase, string> = {
  idle: '',
  intro: '',
  placement: '',
  inhale: 'Inhale',
  holdIn: 'Hold',
  exhale: 'Exhale',
  holdOut: 'Hold',
  done: 'Well done',
};

// Bellows Breath runs one-second phases, so the crossfade has to know how
// little time a cue is actually on screen. Zero-length phases never render.
function shortestPhaseMs(pattern: BreathingTechnique['pattern']): number {
  const durations = [
    pattern.inhale,
    pattern.holdIn,
    pattern.exhale,
    pattern.holdOut,
  ].filter((seconds) => seconds > 0);

  return Math.min(...durations) * 1000;
}

const PHASE_FACES: Record<GuidedBreathingPhase, BreathFace> = {
  idle: 'resting',
  intro: 'resting',
  placement: 'resting',
  inhale: 'inhale',
  holdIn: 'holdIn',
  exhale: 'exhale',
  holdOut: 'holdOut',
  done: 'resting',
};

export const GuidedBreathingPresentation = forwardRef<
  BreathingCircleRef,
  GuidedBreathingPresentationProps
>(function GuidedBreathingPresentation(
  { active, phase, technique, theme, remainingSeconds, heartRate },
  companionRef,
) {
  const isIdle = phase === 'idle';
  const isPlacement = phase === 'placement';
  const isBreathing =
    phase === 'inhale' ||
    phase === 'holdIn' ||
    phase === 'exhale' ||
    phase === 'holdOut';

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const viewport = height - insets.top;
  const reducedMotion = useReducedMotion();
  // Held across every phase after the intro card so the lead-in between finding
  // the pulse and the first cue cannot tear the capture down mid-session.
  const pulseAttached =
    active && heartRate.enabled && heartRate.active && !isIdle;
  const measuringPulse = pulseAttached && isPlacement;
  const trackingPulse = pulseAttached && isBreathing;

  const placementFade = usePlacementFade(measuringPulse);

  const transition = useRef(new Animated.Value(isIdle ? 0 : 1)).current;

  useEffect(() => {
    transition.stopAnimation();

    const animation = Animated.timing(transition, {
      toValue: isIdle ? 0 : 1,
      duration: GUIDED_BREATHING_INTRO_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [isIdle, transition]);

  // Built once per animated source, never per render: RN memoizes a view's
  // animated props on the identity of the nodes driving them, and a fresh
  // interpolation restores the view's default opacity for a frame as the old
  // node detaches. The session re-renders several times a second on its
  // countdown and pulse, which would land those resets mid-crossfade.
  const headlineOpacity = useMemo(
    () =>
      transition.interpolate({
        inputRange: [0, 0.45, 1],
        outputRange: [0, 0.3, 1],
      }),
    [transition],
  );

  const { displayPhase, opacity: stageOpacity } = usePhaseCrossfade(phase, {
    fadeKey: PHASE_LABELS[phase],
    holdMs: shortestPhaseMs(technique.pattern),
  });

  const camera = heartRate.camera;

  const displayBreathing =
    displayPhase === 'inhale' ||
    displayPhase === 'holdIn' ||
    displayPhase === 'exhale' ||
    displayPhase === 'holdOut';
  // Only while the label is the one this count belongs to. Mid-crossfade the
  // phase has already moved on, and the live count beside the outgoing
  // instruction reads as a wrong cue.
  const countdown =
    displayBreathing && displayPhase === phase && remainingSeconds > 0
      ? String(remainingSeconds)
      : '';
  const labelOpacity = useMemo(
    () => Animated.multiply(headlineOpacity, stageOpacity),
    [headlineOpacity, stageOpacity],
  );

  return (
    <View style={styles.stage} pointerEvents="box-none">
      <BreathingCompanion
        ref={companionRef}
        active={active}
        face={PHASE_FACES[phase]}
        theme={theme}
        reducedMotion={reducedMotion}
        visible={!isIdle && !isPlacement}
      />

      {isIdle ? (
        <View style={styles.introLayer} pointerEvents="none">
          <TechniqueIntro
            technique={technique}
            textColors={{
              primary: theme.textPrimary,
              secondary: theme.textSecondary,
              tertiary: theme.textTertiary,
              accent: theme.textAccent,
            }}
          />
        </View>
      ) : null}

      <View style={styles.topBlock} pointerEvents="box-none">
        <View style={styles.headlineArea} pointerEvents="none">
          <Animated.View
            style={[styles.headlineLayer, { opacity: labelOpacity }]}
          >
            {displayPhase === 'done' ? (
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={40}
                color={theme.textPrimary}
              />
            ) : null}
            {PHASE_LABELS[displayPhase] ? (
              <Text
                style={[styles.headline, { color: theme.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                maxFontSizeMultiplier={1.2}
              >
                {PHASE_LABELS[displayPhase]}
              </Text>
            ) : null}
            {/* Holds its line through the crossfade, so clearing the count
                cannot re-centre the instruction above it. */}
            {displayBreathing ? (
              <Text style={[styles.countdown, { color: theme.textSecondary }]}>
                {countdown === '' ? '\u00A0' : countdown}
              </Text>
            ) : null}
          </Animated.View>
        </View>
      </View>

      {measuringPulse ? (
        <HeartRatePlacementStage
          theme={theme}
          viewport={viewport}
          bpm={heartRate.bpm}
          signalSource={heartRate.signalSource}
          fingerPlacement={heartRate.fingerPlacement}
          signalStatus={heartRate.signalStatus}
        />
      ) : null}

      {/* One mount across every live phase. Re-rendering this into a different slot
          would tear down the capture session and drop the pulse lock the
          placement flow just earned. */}
      {camera && pulseAttached ? (
        <Animated.View
          style={
            measuringPulse
              ? [
                  styles.pulsePreview,
                  {
                    top: pulsePreviewTop(viewport),
                    backgroundColor: theme.circleInner,
                    borderColor: theme.circleOutline,
                    opacity: placementFade,
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
        </Animated.View>
      ) : null}

      {trackingPulse ? (
        <View
          style={[styles.readout, { bottom: insets.bottom + spacing.lg }]}
          pointerEvents="none"
        >
          <SessionHeartRateReadout
            theme={theme}
            bpm={heartRate.bpm}
            beatTick={heartRate.beatTick}
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
    alignItems: 'center',
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
    gap: spacing.xs,
  },
  headline: {
    ...typography.display.display1,
    textAlign: 'center',
  },
  countdown: {
    ...typography.display.display2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});
