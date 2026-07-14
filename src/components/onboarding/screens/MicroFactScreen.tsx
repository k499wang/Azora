import { Text } from '../../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface MicroFactScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

interface Slice {
  label: string;
  percent: number;
  accent: string;
}

const SLICES: Slice[] = [
  { label: 'Calmer mind', percent: 58, accent: colors.primary.blue600 },
  { label: 'Slower heart rate', percent: 26, accent: colors.error[500] },
  { label: 'Steadier breath', percent: 16, accent: colors.warning[500] },
];

const CHART_SIZE = 220;
const STROKE = 32;
const RADIUS = (CHART_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function MicroFactScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: MicroFactScreenProps) {
  const sweep = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const legendAnims = useRef(SLICES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.stagger(
        140,
        legendAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 420,
            delay: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [fade, scale, sweep, legendAnims]);

  let cumulative = 0;
  const sliceConfigs = SLICES.map((slice) => {
    const startPercent = cumulative;
    cumulative += slice.percent;
    return {
      ...slice,
      startPercent,
      length: (slice.percent / 100) * CIRCUMFERENCE,
      offset: -((startPercent / 100) * CIRCUMFERENCE),
    };
  });

  return (
    <OnboardingScreenLayout
      title="Did you know?"
      subtitle="What users feel within their first minute of slow breathing."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Cool, let's go" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <Animated.View
          style={[
            styles.chart,
            { opacity: fade, transform: [{ scale }] },
          ]}
        >
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            <G rotation="-90" origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}>
              <Circle
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={RADIUS}
                stroke={colors.background.primary}
                strokeWidth={STROKE}
                fill="none"
              />
              {sliceConfigs.map((slice) => (
                <AnimatedCircle
                  key={slice.label}
                  cx={CHART_SIZE / 2}
                  cy={CHART_SIZE / 2}
                  r={RADIUS}
                  stroke={slice.accent}
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                  fill="none"
                  strokeDasharray={`${slice.length} ${CIRCUMFERENCE}`}
                  strokeDashoffset={sweep.interpolate({
                    inputRange: [0, slice.startPercent / 100, 1],
                    outputRange: [
                      -((slice.startPercent / 100) * CIRCUMFERENCE) -
                        slice.length,
                      -((slice.startPercent / 100) * CIRCUMFERENCE) -
                        slice.length,
                      slice.offset,
                    ],
                  })}
                />
              ))}
            </G>
          </Svg>

          <View style={styles.centerLabel} pointerEvents="none">
            <Text style={styles.centerKicker}>WITHIN</Text>
            <Text style={styles.centerValue}>60s</Text>
            <Text style={styles.centerKicker}>OF SLOW BREATHING</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.legend}>
        {sliceConfigs.map((slice, i) => (
          <Animated.View
            key={slice.label}
            style={[
              styles.legendRow,
              {
                opacity: legendAnims[i],
                transform: [
                  {
                    translateY: legendAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.legendDot, { backgroundColor: slice.accent }]} />
            <Text style={styles.legendLabel}>{slice.label}</Text>
            <Text style={[styles.legendPercent, { color: slice.accent }]}>
              {slice.percent}%
            </Text>
          </Animated.View>
        ))}
      </View>

      <Text style={styles.caption}>
        Slow exhales activate the vagus nerve — your body's brake pedal.
      </Text>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  chart: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerKicker: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.text.tertiary,
  },
  centerValue: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
    color: colors.text.primary,
  },
  legend: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 15,
    color: colors.text.primary,
  },
  legendPercent: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  caption: {
    ...typography.body.small,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.lg,
  },
});
