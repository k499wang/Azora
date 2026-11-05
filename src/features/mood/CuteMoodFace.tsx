import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LEFT_EYE_X = 37;
const RIGHT_EYE_X = 63;
const EYE_Y = 42;
const SCALE = [0, 0.25, 0.5, 0.75, 1];

const MOOD_HUES = [
  colors.playful.violet,
  colors.playful.sky,
  colors.playful.teal,
  colors.playful.amber,
  colors.playful.coral,
];
/** The page behind the face, worst to best: cool and quiet up to warm and bright. */
const MOOD_TINTS = MOOD_HUES.map((hue) => hue.soft);
const MOOD_ACCENTS = MOOD_HUES.map((hue) => hue.mid);

export function moodTint(progress: number): string {
  'worklet';
  return interpolateColor(progress, SCALE, MOOD_TINTS);
}

export function moodAccent(progress: number): string {
  'worklet';
  return interpolateColor(progress, SCALE, MOOD_ACCENTS);
}

interface Props {
  /** 0 is the worst point of the scale, 1 the best; read on the UI thread. */
  progress: SharedValue<number>;
  size: number;
}

/**
 * Big round eyes and a small mouth on the page itself, one continuous expression
 * with no parts swapped in: tears well up from behind the eyes at the bottom of
 * the scale, and at the top the pupils stretch into squeezed-shut `> <` while the
 * mouth opens from its own line.
 */
export default function CuteMoodFace({ progress, size }: Props) {
  const leftTear = useTearProps(progress, LEFT_EYE_X, -1);
  const rightTear = useTearProps(progress, RIGHT_EYE_X, 1);
  const leftBrow = useBrowProps(progress, LEFT_EYE_X, -1);
  const rightBrow = useBrowProps(progress, RIGHT_EYE_X, 1);
  const leftEye = useEyeProps(progress, LEFT_EYE_X, 1);
  const rightEye = useEyeProps(progress, RIGHT_EYE_X, -1);
  const leftPupil = usePupilProps(progress, LEFT_EYE_X, 1);
  const rightPupil = usePupilProps(progress, RIGHT_EYE_X, -1);

  const mouth = useAnimatedProps(() => {
    const p = progress.value;
    const leftX = interpolate(p, SCALE, [39, 38, 43, 38, 36]);
    const rightX = interpolate(p, SCALE, [61, 62, 57, 62, 64]);
    const leftY = interpolate(p, SCALE, [73, 74, 68, 68, 64]);
    const rightY = interpolate(p, SCALE, [73, 65, 68.5, 68, 64]);
    const upperLeft = leftY + interpolate(p, SCALE, [-9, 8, 0, 10, 2]);
    const upperRight = rightY + interpolate(p, SCALE, [-9, -8, 0, 10, 2]);
    const lowerLeft = leftY + interpolate(p, SCALE, [-9, 8, 0, 10, 24]);
    const lowerRight = rightY + interpolate(p, SCALE, [-9, -8, 0, 10, 24]);
    const reach = (rightX - leftX) * 0.15;
    return {
      d:
        `M${leftX} ${leftY} C${leftX + reach} ${upperLeft} ${rightX - reach} ${upperRight} ${rightX} ${rightY} ` +
        `C${rightX - reach} ${lowerRight} ${leftX + reach} ${lowerLeft} ${leftX} ${leftY}Z`,
      strokeWidth: interpolate(p, SCALE, [4.6, 4.6, 4.6, 4.6, 3]),
    };
  });

  const ink = colors.text.primary;
  const tear = colors.playful.sky.mid;
  const white = colors.background.card;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <AnimatedPath animatedProps={leftTear} fill={tear} />
      <AnimatedPath animatedProps={rightTear} fill={tear} />

      <AnimatedPath animatedProps={leftBrow} stroke={ink} strokeLinecap="round" fill="none" />
      <AnimatedPath animatedProps={rightBrow} stroke={ink} strokeLinecap="round" fill="none" />

      <AnimatedCircle animatedProps={leftEye} fill={white} />
      <AnimatedCircle animatedProps={rightEye} fill={white} />
      <AnimatedPath animatedProps={leftPupil} stroke={ink} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <AnimatedPath animatedProps={rightPupil} stroke={ink} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      <AnimatedPath animatedProps={mouth} fill={ink} stroke={ink} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** How far each eye sits off level: `tilt` is +1 for the one that drops. */
function eyeOffset(p: number, tilt: 1 | -1) {
  'worklet';
  return tilt * interpolate(p, SCALE, [0, 4, 1, 0, 0]);
}

/** Drawn behind the eye, its tip fixed there, so it wells up and draws back in. */
function useTearProps(progress: SharedValue<number>, cx: number, side: -1 | 1) {
  return useAnimatedProps(() => {
    const t = interpolate(progress.value, [0, 0.25], [1, 0], 'clamp');
    const x = cx + side * 7;
    const y = 48;
    const h = 15 * t;
    const r = 5 * t;
    return {
      d:
        `M${x} ${y} C${x + r * 0.3} ${y + h * 0.35} ${x + r} ${y + h * 0.5} ${x + r} ${y + h * 0.7} ` +
        `C${x + r} ${y + h * 0.9} ${x + r * 0.5} ${y + h} ${x} ${y + h} ` +
        `C${x - r * 0.5} ${y + h} ${x - r} ${y + h * 0.9} ${x - r} ${y + h * 0.7} ` +
        `C${x - r} ${y + h * 0.5} ${x - r * 0.3} ${y + h * 0.35} ${x} ${y}Z`,
    };
  });
}

/** Worried arcs that shrink and thin away toward the middle of the scale. */
function useBrowProps(progress: SharedValue<number>, cx: number, side: -1 | 1) {
  return useAnimatedProps(() => {
    const p = progress.value;
    const y = EYE_Y + eyeOffset(p, side === -1 ? 1 : -1);
    const reach = interpolate(p, [0.25, 0.5], [1, 0.5], 'clamp');
    return {
      d:
        `M${cx + side * 11 * reach} ${y - 14 - (1 - reach) * 6} ` +
        `Q${cx + side * 6 * reach} ${y - 21} ${cx - side * 3 * reach} ${y - 22}`,
      strokeWidth: interpolate(p, [0.25, 0.5], [3.6, 0], 'clamp'),
    };
  });
}

function useEyeProps(progress: SharedValue<number>, cx: number, tilt: 1 | -1) {
  return useAnimatedProps(() => {
    const p = progress.value;
    return {
      cx,
      cy: EYE_Y + eyeOffset(p, tilt),
      r: interpolate(p, SCALE, [12.5, 12.5, 12.5, 14, 0]),
    };
  });
}

/**
 * A three-point stroke: its points stacked with a wide round cap it is a dot,
 * and pulled apart while the stroke thins it becomes a chevron.
 */
function usePupilProps(progress: SharedValue<number>, cx: number, tilt: 1 | -1) {
  return useAnimatedProps(() => {
    const p = progress.value;
    const y = EYE_Y + eyeOffset(p, tilt) + interpolate(p, SCALE, [0.5, 1, 0, 0, 0]);
    const squeeze = interpolate(p, [0.75, 1], [0, 1], 'clamp');
    const backX = cx - tilt * 6 * squeeze;
    const tipX = cx + tilt * 5 * squeeze;
    const arm = 0.01 + 8 * squeeze;
    return {
      d: `M${backX} ${y - arm} L${tipX} ${y} L${backX} ${y + arm}`,
      strokeWidth: 2 * interpolate(p, SCALE, [7.5, 7.5, 7.5, 8.5, 2.5]),
    };
  });
}
