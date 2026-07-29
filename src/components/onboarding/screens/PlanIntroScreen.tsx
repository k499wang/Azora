import { Text } from '../../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface PlanIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const VISUAL_SIZE = 240;
const RING_CENTER = VISUAL_SIZE / 2;
const RING_RADIUS = 84;
const SEGMENT_SWEEP = 100;
const SEGMENT_START_ANGLES = [-90, 30, 150];
const SEGMENT_COLORS = [
  colors.primary.blue600,
  colors.primary.blue400,
  colors.primary.blue300,
];
const SEGMENT_STAGGER_MS = 260;
const SEGMENT_DURATION_MS = 900;

function polarPoint(angleDegrees: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: RING_CENTER + Math.cos(radians) * RING_RADIUS,
    y: RING_CENTER + Math.sin(radians) * RING_RADIUS,
  };
}

function arcPath(startAngle: number) {
  const start = polarPoint(startAngle);
  const end = polarPoint(startAngle + SEGMENT_SWEEP);
  return `M ${start.x} ${start.y} A ${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

function PlanCelebrationVisual() {
  const segments = useRef(
    SEGMENT_START_ANGLES.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = segments.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        delay: index * SEGMENT_STAGGER_MS,
        duration: SEGMENT_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(animations).start();
    return () => segments.forEach((value) => value.stopAnimation());
  }, [segments]);

  return (
    <View style={styles.visual}>
      <Svg
        width={VISUAL_SIZE}
        height={VISUAL_SIZE}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient
            id="planHalo"
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_CENTER}
            gradientUnits="userSpaceOnUse"
          >
            <Stop
              offset="0"
              stopColor={colors.primary.blue100}
              stopOpacity={0.95}
            />
            <Stop
              offset="0.68"
              stopColor={colors.primary.blue200}
              stopOpacity={0.32}
            />
            <Stop offset="1" stopColor={colors.primary.blue200} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_CENTER}
          fill="url(#planHalo)"
        />
        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.primary.blue200}
          strokeOpacity={0.55}
          strokeWidth={12}
        />
      </Svg>

      {SEGMENT_START_ANGLES.map((startAngle, index) => (
        <Animated.View
          key={startAngle}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: segments[index],
              transform: [
                {
                  rotate: segments[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-70deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width={VISUAL_SIZE} height={VISUAL_SIZE}>
            <Path
              d={arcPath(startAngle)}
              fill="none"
              stroke={SEGMENT_COLORS[index]}
              strokeWidth={12}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      ))}

      <View style={styles.centerDisc} />
      <View style={styles.centerIcon}>
        <Icon name="sparkle" size={64} color={colors.primary.blue600} />
      </View>
    </View>
  );
}

export default function PlanIntroScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PlanIntroScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Build my plan" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <PlanCelebrationVisual />
        <View style={styles.copy}>
          <Text style={styles.headline}>Time to generate your custom plan!</Text>
          <Text style={styles.subhead}>
            Built around your needs, from everything you just shared.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  visual: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
  centerDisc: {
    position: 'absolute',
    left: RING_CENTER - 60,
    top: RING_CENTER - 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.elevated,
    borderWidth: 1.5,
    borderColor: colors.primary.blue200,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  centerIcon: {
    position: 'absolute',
    left: RING_CENTER - 60,
    top: RING_CENTER - 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subhead: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});
