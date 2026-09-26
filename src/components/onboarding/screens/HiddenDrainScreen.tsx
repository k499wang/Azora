import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import AzoPortrait from '../../../features/mascot/AzoPortrait';
import { AZO_ASPECT } from '../../../features/mascot/azoPaths';
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
const VIEW_W = 320;
const VIEW_H = 240;
const SCRIBBLE_HEIGHT = SIZE * (VIEW_H / VIEW_W);
const AZO_HEIGHT = SIZE * 0.9;
const AZO_SIZE = AZO_HEIGHT / AZO_ASPECT;
/** the tangle crosses him at the chest */
const CHEST = 0.55;

/**
 * One unbroken line that coils as it crosses: loose, wide loops out at the
 * wings and a tight knot where it passes through him.
 */
function scribble(): { d: string; length: number } {
  const samples = 900;
  const loops = 16;
  const margin = 30;
  const points: Point[] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const turn = 2 * Math.PI * (loops * t + 1.4 * Math.sin(3 * Math.PI * t));
    const fromCentre = Math.abs(t - 0.5) * 2;
    const radius = 7 + 14 * fromCentre + 5 * Math.sin(turn * 0.66 + 2);
    points.push([
      margin +
        (VIEW_W - margin * 2) * t -
        radius * Math.sin(turn) -
        6 * Math.sin(2.7 * turn + 1),
      VIEW_H * 0.46 +
        22 * Math.sin(Math.PI * 1.4 * t + 0.3) +
        10 * Math.sin(9 * t) -
        radius * 1.1 * Math.cos(turn) -
        6 * Math.cos(2.7 * turn + 1),
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

/** Azo, glum, with a knot of worry drawing itself through him. */
function DrainIllustration() {
  const reduceMotion = useReducedMotion();
  const drawn = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    drawn.value = withDelay(
      300,
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [drawn, reduceMotion]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: SCRIBBLE.length * (1 - drawn.value),
  }));

  return (
    <View style={styles.illustration}>
      <AzoPortrait size={AZO_SIZE} expression="sad" active={false} />
      <Svg
        width={SIZE}
        height={SCRIBBLE_HEIGHT}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={styles.scribble}
        pointerEvents="none"
      >
        <AnimatedPath
          d={SCRIBBLE.d}
          fill="none"
          stroke={colors.neutral[600]}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={SCRIBBLE.length}
          animatedProps={lineProps}
        />
      </Svg>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  scribble: {
    position: 'absolute',
    left: 0,
    top: (SIZE - AZO_HEIGHT) / 2 + AZO_HEIGHT * CHEST - SCRIBBLE_HEIGHT * 0.46,
  },
});
