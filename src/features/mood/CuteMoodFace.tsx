import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const EYE_R = 13;
const LEFT_EYE_X = 33;
const RIGHT_EYE_X = 67;
const EYE_Y = 44;
const MOUTH_Y = 74;

/** The page behind the face, worst to best: cool and quiet up to warm and bright. */
const MOOD_TINTS = [
  colors.playful.violet.soft,
  colors.playful.sky.soft,
  colors.playful.teal.soft,
  colors.playful.amber.soft,
  colors.playful.coral.soft,
];
const TINT_STOPS = MOOD_TINTS.map((_, index) => index / (MOOD_TINTS.length - 1));

export function moodTint(progress: number): string {
  'worklet';
  return interpolateColor(progress, TINT_STOPS, MOOD_TINTS);
}

interface Props {
  /** 0 is the worst point of the scale, 1 the best; read on the UI thread. */
  progress: SharedValue<number>;
  size: number;
}

/**
 * Two round eyes and a mouth on the page itself. The mouth bends from a frown
 * to a smile with the thumb, the pupils follow it, and cheeks blush when bright.
 */
export default function CuteMoodFace({ progress, size }: Props) {
  const mouth = useAnimatedProps(() => {
    const p = progress.value;
    const half = interpolate(p, [0, 0.5, 1], [9, 7, 12]);
    const bend = interpolate(p, [0, 0.5, 1], [-14, 0, 18]);
    return { d: `M${50 - half} ${MOUTH_Y} Q50 ${MOUTH_Y + bend} ${50 + half} ${MOUTH_Y}` };
  });

  const leftPupil = usePupilProps(progress, LEFT_EYE_X, 0);
  const rightPupil = usePupilProps(progress, RIGHT_EYE_X, 0);
  const leftShine = usePupilProps(progress, LEFT_EYE_X, 1);
  const rightShine = usePupilProps(progress, RIGHT_EYE_X, 1);

  const blush = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0.55, 0.9], [0, 0.9], 'clamp'),
  }));

  const ink = colors.text.primary;
  const white = colors.background.card;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <AnimatedEllipse animatedProps={blush} cx={20} cy={62} rx={7} ry={4} fill={colors.playful.blush.tint} />
      <AnimatedEllipse animatedProps={blush} cx={80} cy={62} rx={7} ry={4} fill={colors.playful.blush.tint} />

      <Circle cx={LEFT_EYE_X} cy={EYE_Y} r={EYE_R} fill={white} />
      <Circle cx={RIGHT_EYE_X} cy={EYE_Y} r={EYE_R} fill={white} />
      <AnimatedCircle animatedProps={leftPupil} fill={ink} />
      <AnimatedCircle animatedProps={rightPupil} fill={ink} />
      <AnimatedCircle animatedProps={leftShine} fill={white} />
      <AnimatedCircle animatedProps={rightShine} fill={white} />

      <AnimatedPath
        animatedProps={mouth}
        stroke={ink}
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** The pupil looks down when low and grows a little when bright; `shine` is its highlight. */
function usePupilProps(progress: SharedValue<number>, cx: number, shine: 0 | 1) {
  return useAnimatedProps(() => {
    const p = progress.value;
    const r = interpolate(p, [0, 1], [6.5, 7.5]);
    const x = cx + interpolate(p, [0, 1], [-2.5, 2.5]);
    const y = EYE_Y + interpolate(p, [0, 0.5, 1], [3, 1, 0]);
    return shine
      ? { cx: x + r * 0.35, cy: y - r * 0.4, r: r * 0.32 }
      : { cx: x, cy: y, r };
  });
}
