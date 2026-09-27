import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import AzoPortrait from '../../../features/mascot/AzoPortrait';
import {
  AZO_ASPECT,
  STAGE_HEIGHT,
  STAGE_Y,
} from '../../../features/mascot/azoPaths';
import { colors } from '../../../theme/colors';
import { Text } from '../../common/Text';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingVisualIntro, {
  ONBOARDING_VISUAL_SIZE,
  onboardingVisualEmphasis,
} from '../OnboardingVisualIntro';

interface HiddenDrainScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

type Point = [number, number];

const SIZE = ONBOARDING_VISUAL_SIZE;
const AZO_HEIGHT = SIZE * 0.74;
const AZO_SIZE = AZO_HEIGHT / AZO_ASPECT;
const HEAD_TOP = SIZE - AZO_HEIGHT + AZO_HEIGHT * (-STAGE_Y / STAGE_HEIGHT);

const VIEW_W = 100;
const VIEW_H = 50;
const SCRIBBLE_WIDTH = SIZE * 0.54;
const SCRIBBLE_HEIGHT = SCRIBBLE_WIDTH * (VIEW_H / VIEW_W);

/** One unbroken line that coils into a tight knot in the middle and loosens at the ends. */
function scribble(): { d: string; length: number } {
  const samples = 700;
  const loops = 13;
  const spread = 28;
  const points: Point[] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const turn = 2 * Math.PI * (loops * t + 1.2 * Math.sin(3 * Math.PI * t));
    const toCentre = 1 - Math.abs(t - 0.5) * 2;
    const radius = 5 + 8 * toCentre + 1.5 * Math.sin(turn * 0.66 + 2);
    points.push([
      VIEW_W / 2 +
        spread * (2 * t - 1) -
        radius * Math.sin(turn) -
        2 * Math.sin(2.7 * turn + 1),
      VIEW_H / 2 +
        2 * Math.sin(Math.PI * 1.4 * t + 0.3) -
        radius * 1.05 * Math.cos(turn) -
        2 * Math.cos(2.7 * turn + 1),
    ]);
  }

  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
  }
  const d = `M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')}`;
  return { d, length };
}

const SCRIBBLE = scribble();

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Azo, glum, with a knot of worry scribbling itself above his head. */
function DrainIllustration() {
  const reduceMotion = useReducedMotion();
  const drawn = useSharedValue(reduceMotion ? 1 : 0);
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    drawn.value = withDelay(
      300,
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) }),
    );
    const bob = { duration: 1600, easing: Easing.inOut(Easing.sin) };
    float.value = withDelay(
      300,
      withRepeat(
        withSequence(withTiming(-SIZE * 0.015, bob), withTiming(0, bob)),
        -1,
      ),
    );
  }, [drawn, float, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));
  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: SCRIBBLE.length * (1 - drawn.value),
  }));

  return (
    <View style={styles.illustration}>
      <View style={styles.azo}>
        <AzoPortrait size={AZO_SIZE} expression="sad" active={false} />
      </View>
      <Animated.View style={[styles.scribble, floatStyle]} pointerEvents="none">
        <Svg
          width={SCRIBBLE_WIDTH}
          height={SCRIBBLE_HEIGHT}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        >
          <AnimatedPath
            d={SCRIBBLE.d}
            fill="none"
            stroke={colors.neutral[600]}
            strokeWidth={0.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={SCRIBBLE.length}
            animatedProps={lineProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function HiddenDrainScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: HiddenDrainScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingVisualIntro
        illustration={<DrainIllustration />}
        title={
          <>
            It’s not always obvious what’s{' '}
            <Text style={styles.emphasis}>draining you</Text>.
          </>
        }
        subtitle="Most people misread the signs of burnout, so what’s really going on never gets addressed."
      />
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  emphasis: onboardingVisualEmphasis,
  illustration: {
    width: SIZE,
    height: SIZE,
  },
  azo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  scribble: {
    position: 'absolute',
    top: HEAD_TOP - SCRIBBLE_HEIGHT - SIZE * 0.012,
    left: (SIZE - SCRIBBLE_WIDTH) / 2,
  },
});
