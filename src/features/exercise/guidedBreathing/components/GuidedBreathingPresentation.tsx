import { Text } from '../../../../components/common/Text';
import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BreathingCircle, { type BreathingCircleRef } from '../../shared/components/BreathingCircle';
import TechniqueIntro from './TechniqueIntro';
import { HeartRateCameraPreview } from '../../../../components/heartRate/HeartRateCameraPreview';
import type { HeartRateCameraPreviewProps } from '../../../../components/heartRate/HeartRateCameraPreview';
import { LiveSignalGraph } from '../../../../components/heartRate/LiveSignalGraph';
import { ExerciseHeartRateGuidance } from '../../shared/components/ExerciseHeartRateGuidance';
import type { BreathingTechnique } from '../techniques';
import type { BreathingPhase } from '../domain/breathingSessionTiming';
import type {
  FingerPlacementState,
  LivePpgSignalSample,
  SignalStatus,
} from '../../../../lib/heartRate/types';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { fonts } from '../../../../theme/typography';

export const GUIDED_BREATHING_INTRO_DURATION_MS = 750;

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
  samples: LivePpgSignalSample[];
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  camera?: GuidedBreathingCamera;
}

interface GuidedBreathingPresentationProps {
  phase: GuidedBreathingPhase;
  technique: BreathingTechnique;
  theme: ExerciseDarkTheme;
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

export const GuidedBreathingPresentation = forwardRef<
  BreathingCircleRef,
  GuidedBreathingPresentationProps
>(function GuidedBreathingPresentation(
  { phase, technique, theme, heartRate },
  circleRef,
) {
  const isIdle = phase === 'idle';
  const isPlacement = phase === 'placement';
  const isBreathing =
    phase === 'inhale' ||
    phase === 'holdIn' ||
    phase === 'exhale' ||
    phase === 'holdOut';

  const transition = useRef(new Animated.Value(isIdle ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: isIdle ? 0 : 1,
      duration: GUIDED_BREATHING_INTRO_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isIdle, transition]);

  const introOpacity = transition.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.4, 0],
  });
  const introScale = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });
  const introTranslateY = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });
  const circleOpacity = transition.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.3, 1],
  });
  const circleScale = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  const camera = heartRate.camera;
  const cameraSlot =
    camera != null && (isPlacement || isBreathing) && heartRate.active ? (
    <HeartRateCameraPreview
      {...camera}
      fingerPlacement={heartRate.fingerPlacement}
      isActive={heartRate.active}
    />
  ) : null;
  return (
    <View style={styles.centerStack}>
      {heartRate.enabled && heartRate.active ? (
        <View style={styles.liveSignalGraphSlot} pointerEvents="none">
          <LiveSignalGraph
            samples={heartRate.samples}
            fingerPlacement={heartRate.fingerPlacement}
            bpm={heartRate.bpm}
            beatTick={heartRate.beatTick}
            textColor={theme.textPrimary}
          />
        </View>
      ) : null}

      <View style={styles.contentArea}>
        <Animated.View
          style={[
            styles.contentLayer,
            {
              opacity: introOpacity,
              transform: [{ scale: introScale }, { translateY: introTranslateY }],
            },
          ]}
        >
          <TechniqueIntro
            technique={technique}
            textColors={{
              primary: theme.textPrimary,
              secondary: theme.textSecondary,
              tertiary: theme.textTertiary,
              accent: theme.textAccent,
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.contentLayer,
            {
              opacity: circleOpacity,
              transform: [{ scale: circleScale }],
            },
          ]}
        >
          <BreathingCircle
            ref={circleRef}
            cameraSlot={cameraSlot}
            beatTick={heartRate.beatTick}
            themeColors={{
              outline: theme.circleOutline,
              outlineOpacity: theme.circleOutlineOpacity,
              outer: theme.circleOuter,
              outerOpacity: theme.circleOuterOpacity,
              inner: theme.circleInner,
              beatFlush: theme.beatFlush,
            }}
          >
            {phase === 'done' ? (
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={32}
                color={colors.neutral[50]}
              />
            ) : PHASE_LABELS[phase] ? (
              <Text
                style={styles.phaseLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                maxFontSizeMultiplier={1.2}
              >
                {PHASE_LABELS[phase]}
              </Text>
            ) : null}
          </BreathingCircle>
        </Animated.View>
      </View>

      <ExerciseHeartRateGuidance
        placementActive={isPlacement}
        breathingActive={isBreathing}
        theme={theme}
        active={heartRate.active}
        fingerPlacement={heartRate.fingerPlacement}
        signalStatus={heartRate.signalStatus}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    width: 340,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSignalGraphSlot: {
    position: 'absolute',
    top: -102,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 1.2,
    color: colors.neutral[50],
    textAlign: 'center',
  },
});
