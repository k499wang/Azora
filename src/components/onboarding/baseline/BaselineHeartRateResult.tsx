import { Text } from '../../common/Text';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import {
  Easing as RNREasing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  describeRestingHeartRate,
  restingHeartRateGaugeFill,
  MAX_GAUGE_BPM,
  MIN_GAUGE_BPM,
  type RestingHeartRateBand,
  type RestingHeartRateSex,
} from '../../../lib/restingHeartRate';
import { calibrationDurationMs } from '../../../lib/gaugeCalibration';
import type { GenderOption } from '../data/genderOptions';
import type { CompletedOnboardingBaselineResult } from '../types';

interface BaselineHeartRateResultProps {
  result: CompletedOnboardingBaselineResult;
  age: number;
  gender: GenderOption['id'] | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
}

const GAUGE_SIZE = 250;
const GAUGE_STROKE = 12;
const GAUGE_CX = GAUGE_SIZE / 2;
const GAUGE_CY = GAUGE_SIZE / 2;
const GAUGE_R = GAUGE_SIZE / 2 - GAUGE_STROKE / 2 - 8;
const GAUGE_START = 135;
const GAUGE_SWEEP = 270;
const GAUGE_TICK_INNER = GAUGE_R - GAUGE_STROKE / 2 - 6;
const GAUGE_TICK_OUTER = GAUGE_R - GAUGE_STROKE / 2 - 2;
const GAUGE_INNER_R = GAUGE_R - GAUGE_STROKE / 2 - 14;
const MIN_BPM_CALIBRATION_MS = 1600;

function gaugeTickPath(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = Skia.Path.Make();
  p.moveTo(GAUGE_CX + GAUGE_TICK_INNER * cos, GAUGE_CY + GAUGE_TICK_INNER * sin);
  p.lineTo(GAUGE_CX + GAUGE_TICK_OUTER * cos, GAUGE_CY + GAUGE_TICK_OUTER * sin);
  return p;
}

const GAUGE_RECT = Skia.XYWHRect(
  GAUGE_CX - GAUGE_R,
  GAUGE_CY - GAUGE_R,
  GAUGE_R * 2,
  GAUGE_R * 2,
);

const GAUGE_TRACK_PATH = (() => {
  const p = Skia.Path.Make();
  p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP);
  return p;
})();

const GAUGE_TICK_PATHS = [0, 25, 50, 75, 100].map((t) =>
  gaugeTickPath(GAUGE_START + (t / 100) * GAUGE_SWEEP),
);

const BAND_COLOR: Record<RestingHeartRateBand, string> = {
  below: colors.success[500],
  typical: colors.primary.blue600,
  above: colors.warning[500],
};

function toSex(gender: GenderOption['id'] | null): RestingHeartRateSex {
  if (gender === 'female' || gender === 'male') return gender;
  return 'unspecified';
}

function AnimatedBpmValue({ progress }: { progress: SharedValue<number> }) {
  const [displayedBpm, setDisplayedBpm] = useState(MIN_GAUGE_BPM);

  // Keep numeric ticks local so they do not re-render the Skia gauge while its
  // arc is animating. Both visuals still read from the same shared value.
  useAnimatedReaction(
    () =>
      Math.round(
        MIN_GAUGE_BPM + (progress.value / 100) * (MAX_GAUGE_BPM - MIN_GAUGE_BPM),
      ),
    (bpm, previous) => {
      if (bpm !== previous) {
        runOnJS(setDisplayedBpm)(bpm);
      }
    },
  );

  return (
    <View style={styles.gaugeValueRow}>
      <Text style={styles.gaugeValue}>{displayedBpm}</Text>
      <Text style={styles.gaugeValueMax}>bpm</Text>
    </View>
  );
}

export default function BaselineHeartRateResult({
  result,
  age,
  gender,
  stepIndex,
  stepCount,
  onContinue,
}: BaselineHeartRateResultProps) {
  const avgBpm = result.avgBpm;
  const context = useMemo(
    () => describeRestingHeartRate({ bpm: avgBpm, age, sex: toSex(gender) }),
    [avgBpm, age, gender],
  );

  const [isCalibrating, setIsCalibrating] = useState(true);
  const doneEnter = useRef(new Animated.Value(0)).current;
  const arcProgress = useSharedValue(0);
  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const ratio = Math.max(0, Math.min(1, arcProgress.value / 100));
    if (ratio > 0) {
      p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP * ratio);
    }
    return p;
  });

  const finishCalibration = useCallback(() => {
    doneEnter.setValue(0);
    setIsCalibrating(false);
    Animated.timing(doneEnter, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [doneEnter]);

  useEffect(() => {
    // Sweeps up from the low end of the gauge so the needle settles onto the
    // measured rate rather than snapping to it.
    const fromFill = restingHeartRateGaugeFill(MIN_GAUGE_BPM);
    const toFill = restingHeartRateGaugeFill(avgBpm);
    arcProgress.value = fromFill;
    arcProgress.value = withTiming(
      toFill,
      {
        duration: Math.max(
          MIN_BPM_CALIBRATION_MS,
          calibrationDurationMs(fromFill, toFill),
        ),
        easing: RNREasing.inOut(RNREasing.quad),
      },
      (finished) => {
        if (finished) runOnJS(finishCalibration)();
      },
    );

    return () => cancelAnimation(arcProgress);
  }, [avgBpm, arcProgress, finishCalibration]);

  const bandColor = BAND_COLOR[context.band];
  const revealStyle = {
    opacity: doneEnter,
    transform: [
      {
        translateY: doneEnter.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      footer={
        isCalibrating ? (
          <View />
        ) : (
          <OnboardingPrimaryButton
            label="Continue"
            onPress={onContinue}
            enableHaptics={false}
          />
        )
      }
    >
      <View style={styles.gaugeStage}>
        <Text style={styles.gaugeHeading}>
          {isCalibrating ? 'Reading…' : 'Your resting heart rate'}
        </Text>
        <Text style={[styles.gaugeSub, { color: bandColor }]}>
          {isCalibrating ? 'Analyzing your pulse.' : context.bandLabel}
        </Text>

        <View style={styles.gaugeSurface}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Path
              path={GAUGE_TRACK_PATH}
              style="stroke"
              strokeWidth={GAUGE_STROKE}
              strokeCap="round"
              color={colors.neutral[100]}
            />
            <Path
              path={arcPath}
              style="stroke"
              strokeWidth={GAUGE_STROKE}
              strokeCap="round"
              color={bandColor}
            />
            {GAUGE_TICK_PATHS.map((p, i) => (
              <Path
                key={i}
                path={p}
                style="stroke"
                strokeWidth={1.5}
                strokeCap="round"
                color={colors.neutral[200]}
              />
            ))}
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY + 3}
              r={GAUGE_INNER_R + 3}
              color="rgba(15,23,42,0.04)"
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY + 1.5}
              r={GAUGE_INNER_R + 1.5}
              color="rgba(15,23,42,0.02)"
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY}
              r={GAUGE_INNER_R + 1}
              color={colors.neutral[200]}
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY}
              r={GAUGE_INNER_R}
              color={colors.background.elevated}
            />
          </Canvas>

          <View style={styles.gaugeCenter} pointerEvents="none">
            <AnimatedBpmValue progress={arcProgress} />
          </View>
        </View>

        {!isCalibrating ? (
          <Animated.View style={[styles.gaugeMeta, revealStyle]}>
            <Text style={styles.range}>
              Typical for {context.peerLabel}: {context.typicalLow}–
              {context.typicalHigh} bpm
            </Text>
            <Text style={styles.followup}>{context.detail}</Text>
          </Animated.View>
        ) : null}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  gaugeStage: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  gaugeHeading: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  gaugeSub: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -spacing.lg,
  },
  gaugeSurface: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    position: 'relative',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  gaugeCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueRow: {
    alignItems: 'center',
  },
  gaugeValue: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 76,
    lineHeight: 80,
    letterSpacing: -1.5,
    color: colors.text.primary,
  },
  gaugeValueMax: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: -0.2,
    marginTop: -spacing.xs,
  },
  gaugeMeta: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  range: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  followup: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
