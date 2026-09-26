import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../common/Text';
import { colors } from '../../../theme/colors';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingVisualIntro, {
  ONBOARDING_VISUAL_SIZE,
  onboardingVisualEmphasis,
} from '../OnboardingVisualIntro';

interface PiecesTogetherScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

type Point = [number, number];

const CELL = 100;
const VIEW = CELL * 2;
const SIZE = ONBOARDING_VISUAL_SIZE;
/** corner rounding, in view units */
const CORNER = 16;
/** how far apart the pieces start, in view units, before they slide home */
const SPREAD = 22;
/** traced in each piece's own fill so no hairline of canvas shows where two meet */
const SEAM = 1;

/**
 * A knob with a neck, in edge-local units: `u` runs along the side from 0 to 1,
 * `v` is how far it swells out, both as a fraction of the side's length.
 */
const KNOB: Point[][] = [
  [[0.42, 0], [0.44, 0.07], [0.4, 0.11]],
  [[0.33, 0.2], [0.39, 0.32], [0.5, 0.32]],
  [[0.61, 0.32], [0.67, 0.2], [0.6, 0.11]],
  [[0.56, 0.07], [0.58, 0], [0.62, 0]],
];

const add = ([ax, ay]: Point, [bx, by]: Point, k = 1): Point => [ax + bx * k, ay + by * k];
const fmt = ([x, y]: Point) => `${x} ${y}`;

/**
 * One side of a piece from `a` to `b`, stopping short of both corners so they
 * can be rounded, with a knob swelling towards `bulge` if it has one.
 */
function side(a: Point, b: Point, bulge?: Point): string {
  const along: Point = [(b[0] - a[0]) / CELL, (b[1] - a[1]) / CELL];
  const at = ([u, v]: Point) => add(add(a, along, u * CELL), bulge ?? [0, 0], v * CELL);
  const knob = bulge
    ? `L ${fmt(at([0.38, 0]))} ${KNOB.map((curve) => `C ${curve.map((pt) => fmt(at(pt))).join(' ')}`).join(' ')}`
    : '';
  return `${knob} L ${fmt(add(b, along, -CORNER))}`;
}

interface Edges {
  top?: Point;
  right?: Point;
  bottom?: Point;
  left?: Point;
}

/** A rounded square cell of the 2×2 grid, traced clockwise from its top-left. */
function piece(col: number, row: number, edges: Edges): string {
  const x0 = col * CELL;
  const y0 = row * CELL;
  const corners: Point[] = [
    [x0, y0],
    [x0 + CELL, y0],
    [x0 + CELL, y0 + CELL],
    [x0, y0 + CELL],
  ];
  const bulges = [edges.top, edges.right, edges.bottom, edges.left];

  return corners
    .map((corner, i) => {
      const next = corners[(i + 1) % 4];
      const after = corners[(i + 2) % 4];
      const into: Point = [(after[0] - next[0]) / CELL, (after[1] - next[1]) / CELL];
      return `${side(corner, next, bulges[i])} Q ${fmt(next)} ${fmt(add(next, into, CORNER))}`;
    })
    .reduce((path, segment) => `${path} ${segment}`, `M ${x0 + CORNER} ${y0}`)
    .concat(' Z');
}

const RIGHT: Point = [1, 0];
const DOWN: Point = [0, 1];
const LEFT: Point = [-1, 0];
const UP: Point = [0, -1];

const PIECES = [
  { fill: colors.primary.blue500, dir: [-1, -1], d: piece(0, 0, { right: RIGHT, bottom: DOWN }) },
  { fill: colors.orange[400], dir: [1, -1], d: piece(1, 0, { bottom: UP, left: RIGHT }) },
  { fill: colors.success[500], dir: [-1, 1], d: piece(0, 1, { top: DOWN, right: LEFT }) },
  { fill: colors.yellow[400], dir: [1, 1], d: piece(1, 1, { top: UP, left: LEFT }) },
];

/** Four pieces, one per kind of struggle, sliding in until they fit. */
function PuzzleIllustration() {
  const join = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(join, {
      toValue: 1,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
  }, [join]);

  const toPx = SIZE / VIEW;
  const offset = join.interpolate({
    inputRange: [0, 1],
    outputRange: [SPREAD * toPx, 0],
  });

  return (
    <View style={styles.illustration}>
      {PIECES.map((p) => (
        <Animated.View
          key={p.fill}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: Animated.multiply(offset, p.dir[0]) },
                { translateY: Animated.multiply(offset, p.dir[1]) },
              ],
            },
          ]}
        >
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEW} ${VIEW}`}>
            <Path
              d={p.d}
              fill={p.fill}
              stroke={p.fill}
              strokeWidth={SEAM}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

export default function PiecesTogetherScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PiecesTogetherScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingVisualIntro
        illustration={<PuzzleIllustration />}
        title={
          <>
            Azora puts <Text style={styles.emphasis}>all the pieces</Text>{' '}
            together.
          </>
        }
        subtitle="Whether it’s stress, a messy space, or low energy, we’ll help you fix what matters most, one small step a day."
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
});
