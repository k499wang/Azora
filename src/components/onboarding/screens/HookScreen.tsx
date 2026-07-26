import { AnimatedText } from '../../common/Text';
import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STAGE_WIDTH = 190;
const STAGE_HEIGHT = 114;

// Midline perimeter of the rounded rect below: 2×52 + 2×12 + 4×(π/2×18).
const PERIMETER = 241.097;
// Perimeter holds exactly 18 dash cycles, so the pattern is seamless at the
// path seam and the loop only has to travel one cycle to repeat exactly.
const DASH_CYCLE = PERIMETER / 18;
const DASH_ON = 6.2;
const DASH_OFF = DASH_CYCLE - DASH_ON;

function CycleRectangle() {
  const flow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // JS-driven on purpose: native-driver loops have been unreliable here.
    const loop = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      { resetBeforeIteration: true },
    );
    loop.start();
    return () => loop.stop();
  }, [flow]);

  const dashOffset = flow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -DASH_CYCLE],
  });

  return (
    <Svg width={STAGE_WIDTH} height={STAGE_HEIGHT} viewBox="0 0 100 60">
      <AnimatedPath
        d="M24 6 H76 A18 18 0 0 1 94 24 V36 A18 18 0 0 1 76 54 H24 A18 18 0 0 1 6 36 V24 A18 18 0 0 1 24 6 Z"
        stroke={colors.primary.blue300}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={[DASH_ON, DASH_OFF]}
        strokeDashoffset={dashOffset}
        fill="none"
      />
    </Svg>
  );
}

const BREATH_IN_MS = 4000;
const BREATH_OUT_MS = 6000;

function BreathCircle() {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: BREATH_IN_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: BREATH_OUT_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const coreRadius = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [13, 23],
  });
  const haloRadius = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [19, 28],
  });
  const haloOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.6],
  });

  return (
    <Svg width={STAGE_WIDTH} height={STAGE_HEIGHT} viewBox="0 0 100 60">
      <AnimatedCircle
        cx={50}
        cy={30}
        r={haloRadius}
        stroke={colors.primary.blue300}
        strokeOpacity={haloOpacity}
        strokeWidth={1.5}
        fill="none"
      />
      <AnimatedCircle
        cx={50}
        cy={30}
        r={coreRadius}
        stroke={colors.primary.blue500}
        strokeWidth={2.5}
        fill="none"
      />
    </Svg>
  );
}

// Jagged on the left, settling into progressively shallower waves — the trace
// reads as the measurement and the calm-down in one stroke.
const TRACE_PATH =
  'M2 30 H10 L13 13 L16 47 L19 16 L22 44 L25 19 L28 41 L31 30 C38 30 38 18 45 18 C52 18 52 42 59 42 C66 42 66 21 72 21 C78 21 78 39 84 39 C89 39 89 27 94 27 C96 27 97 30 98 30';
// Approximate arc length of TRACE_PATH; only needs to exceed the true length so
// the dash pattern fully covers the stroke at both ends of the sweep.
const TRACE_LENGTH = 260;
const TRACE_SWEEP_MS = 3600;

function CalmingTrace() {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: TRACE_SWEEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      { resetBeforeIteration: true },
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  // Draws in from the left across the first half, then wipes out the same way.
  const dashOffset = sweep.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [TRACE_LENGTH, 0, -TRACE_LENGTH],
  });

  return (
    <Svg width={STAGE_WIDTH} height={STAGE_HEIGHT} viewBox="0 0 100 60">
      <Path
        d={TRACE_PATH}
        stroke={colors.primary.blue100}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <AnimatedPath
        d={TRACE_PATH}
        stroke={colors.primary.blue500}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[TRACE_LENGTH, TRACE_LENGTH]}
        strokeDashoffset={dashOffset}
        fill="none"
      />
    </Svg>
  );
}

export type HookBeat = 'system' | 'lever' | 'loop';

interface HookBeatContent {
  Visual: () => ReactElement;
  headingLead: string;
  headingAccent: string;
  subtitle: string;
}

const BEATS: Record<HookBeat, HookBeatContent> = {
  system: {
    Visual: CycleRectangle,
    headingLead: 'Your heart rate, sleep, and stress all run on ',
    headingAccent: 'one system.',
    subtitle:
      'One nervous system sets all three. They wind up together, and they settle together.',
  },
  lever: {
    Visual: BreathCircle,
    headingLead: 'Your breath is the only part of it you can ',
    headingAccent: 'control directly.',
    subtitle:
      "You can't slow your pulse on command. You can slow your exhale — and your pulse follows it down.",
  },
  loop: {
    Visual: CalmingTrace,
    headingLead: 'Azora reads where you are, then brings it down. ',
    headingAccent: 'Same minute.',
    subtitle:
      'A tracker shows you the number and stops there. This is the part that changes it.',
  },
};

interface HookScreenProps {
  beat: HookBeat;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
}

export default function HookScreen({
  beat,
  stepIndex,
  stepCount,
  onContinue,
}: HookScreenProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const subtitleEnter = useRef(new Animated.Value(0)).current;
  const { Visual, headingLead, headingAccent, subtitle } = BEATS[beat];

  useEffect(() => {
    enter.setValue(0);
    subtitleEnter.setValue(0);

    const animation = Animated.parallel([
      Animated.timing(enter, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleEnter, {
        toValue: 1,
        duration: 620,
        delay: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();

    return () => animation.stop();
  }, [beat, enter, subtitleEnter]);

  const lift = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const subtitleLift = subtitleEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      fullWidthProgress
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <Animated.View style={[styles.visual, { opacity: enter }]}>
          <Visual />
        </Animated.View>
        <AnimatedText
          style={[
            styles.heading,
            { opacity: enter, transform: [{ translateY: lift }] },
          ]}
        >
          {headingLead}
          <AnimatedText style={styles.headingAccent}>{headingAccent}</AnimatedText>
        </AnimatedText>
        <AnimatedText
          style={[
            styles.subtitle,
            { opacity: subtitleEnter, transform: [{ translateY: subtitleLift }] },
          ]}
        >
          {subtitle}
        </AnimatedText>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  visual: {
    marginBottom: spacing.sm,
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headingAccent: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: colors.primary.blue600,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});
