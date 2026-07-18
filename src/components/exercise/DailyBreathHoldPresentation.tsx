import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import BreathingCircle, { type BreathingCircleRef } from './BreathingCircle';
import BreathHoldIntro, { type BreathHoldStep } from './BreathHoldIntro';
import { HeartRateCameraPreview } from '../heartRate/HeartRateCameraPreview';
import type { HeartRateCameraPreviewProps } from '../heartRate/HeartRateCameraPreview';
import { LiveSignalGraph } from '../heartRate/LiveSignalGraph';
import { DailyBreathHoldGuidance } from './DailyBreathHoldGuidance';
import type {
  FingerPlacementState,
  LivePpgSignalSample,
  SignalStatus,
} from '../../lib/heartRate/types';
import {
  isBreathHoldBreathingPhase,
  type DailyBreathHoldPhase,
} from '../../lib/breathHoldPhases';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export const DAILY_BREATH_HOLD_INTRO_DURATION_MS = 750;

const INTRO_TITLE = 'Daily Breath Hold';

const PHASE_LABELS: Record<DailyBreathHoldPhase, string> = {
  idle: '',
  intro: '',
  placement: '',
  preInhale: 'Inhale',
  preExhale: 'Exhale',
  inhale: 'Inhale',
  hold: 'Hold',
  processingResults: '',
  done: 'Done',
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
  samples: LivePpgSignalSample[];
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  camera?: DailyBreathHoldCamera;
}

interface DailyBreathHoldPresentationProps {
  phase: DailyBreathHoldPhase;
  theme: ExerciseDarkTheme;
  prepCycles: number;
  prepInhaleSeconds: number;
  prepExhaleSeconds: number;
  heartRate: DailyBreathHoldHeartRatePresentation;
  onReleasePress: () => void;
}

export const DailyBreathHoldPresentation = forwardRef<
  BreathingCircleRef,
  DailyBreathHoldPresentationProps
>(function DailyBreathHoldPresentation(
  {
    phase,
    theme,
    prepCycles,
    prepInhaleSeconds,
    prepExhaleSeconds,
    heartRate,
    onReleasePress,
  },
  circleRef,
) {
  const isPlacement = phase === 'placement';
  const breathingActive = isBreathHoldBreathingPhase(phase);
  const isLive = breathingActive || phase === 'hold';
  const transition = useRef(new Animated.Value(phase === 'idle' ? 0 : 1)).current;
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

  useEffect(() => {
    if (phase === 'intro') transition.setValue(0);

    Animated.timing(transition, {
      toValue: phase === 'idle' ? 0 : 1,
      duration: DAILY_BREATH_HOLD_INTRO_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [phase, transition]);

  const camera = heartRate.camera;
  const cameraSlot =
    camera != null && (isLive || isPlacement) && heartRate.active ? (
      <HeartRateCameraPreview
        {...camera}
        fingerPlacement={heartRate.fingerPlacement}
        isActive={heartRate.active}
      />
    ) : null;

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

  return (
    <View style={styles.centerSlotWrap}>
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

        <Animated.View
          style={[
            styles.contentLayer,
            { opacity: circleOpacity, transform: [{ scale: circleScale }] },
          ]}
          pointerEvents={phase === 'idle' ? 'none' : 'auto'}
        >
          <Pressable
            onPress={onReleasePress}
            disabled={phase !== 'hold'}
            accessibilityRole="button"
            accessibilityLabel={phase === 'hold' ? 'Tap to release hold' : undefined}
            style={({ pressed }) => [
              styles.centerStack,
              phase === 'hold' && pressed && styles.circleTapPressed,
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
              {PHASE_LABELS[phase] ? (
                <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
              ) : null}
            </BreathingCircle>
          </Pressable>
        </Animated.View>

        <DailyBreathHoldGuidance
          placementActive={isPlacement}
          liveActive={isLive}
          holdActive={phase === 'hold'}
          theme={theme}
          heartRateActive={heartRate.active}
          fingerPlacement={heartRate.fingerPlacement}
          signalStatus={heartRate.signalStatus}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  centerSlotWrap: {
    width: '100%',
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
  contentArea: {
    width: 340,
    height: 300,
    marginBottom: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTapPressed: {
    opacity: 0.85,
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
