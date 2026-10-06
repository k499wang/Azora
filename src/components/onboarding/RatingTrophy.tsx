import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { stagger } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { Pop } from '../common/Reveal';
import { LoopingTwinkle } from '../common/RewardSparkles';
import { Text } from '../common/Text';

interface Props {
  value: string;
  label: string;
  size: number;
  /** ms after mount at which the trophy starts popping in */
  enterAt: number;
}

type Point = [number, number];

const VIEW_W = 300;
const VIEW_H = 182;
const LAUREL = colors.yellow[500];

/** One upright sprig beside the trophy, bottom to top, bowing slightly outwards. */
const STEM: [Point, Point, Point] = [
  [60, 174],
  [38, 138],
  [54, 104],
];
const LEAF_STEPS = [0.1, 0.4, 0.7];
const LEAF_ANGLE = 40;
const LEAF = { rx: 10.5, ry: 5 };
const TIP_LEAF = { rx: 10, ry: 5 };

function stemAt(t: number): { point: Point; angle: number } {
  const [[x0, y0], [x1, y1], [x2, y2]] = STEM;
  const u = 1 - t;
  const point: Point = [
    u * u * x0 + 2 * u * t * x1 + t * t * x2,
    u * u * y0 + 2 * u * t * y1 + t * t * y2,
  ];
  const dx = 2 * u * (x1 - x0) + 2 * t * (x2 - x1);
  const dy = 2 * u * (y1 - y0) + 2 * t * (y2 - y1);
  return { point, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const LEAVES = LEAF_STEPS.flatMap((t) => {
  const { point, angle } = stemAt(t);
  return [
    { point, rotate: angle - LEAF_ANGLE, ...LEAF },
    { point, rotate: angle + LEAF_ANGLE, ...LEAF },
  ];
});
const TIP = stemAt(1);
LEAVES.push({ point: TIP.point, rotate: TIP.angle, ...TIP_LEAF });

const STEM_PATH = `M ${STEM[0].join(' ')} Q ${STEM[1].join(' ')} ${STEM[2].join(' ')}`;

function Branch() {
  return (
    <G>
      <Path d={STEM_PATH} stroke={LAUREL} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      {LEAVES.map((leaf, i) => (
        <G key={i} transform={`translate(${leaf.point[0]} ${leaf.point[1]}) rotate(${leaf.rotate})`}>
          <Ellipse cx={leaf.rx} cy={0} rx={leaf.rx} ry={leaf.ry} fill={LAUREL} />
        </G>
      ))}
    </G>
  );
}

/**
 * Five stars on an arc over the trophy, centres and radii in view units. Each
 * twinkles on its own period so the arc never pulses in step.
 */
const STARS = [
  { x: 66, y: 60, r: 13, period: 1700 },
  { x: 104, y: 32, r: 17, period: 1500 },
  { x: 150, y: 24, r: 21, period: 1900 },
  { x: 196, y: 32, r: 17, period: 1600 },
  { x: 234, y: 60, r: 13, period: 1800 },
];

/** The koala-head cup's placement: drawn at 120 × 138, set between the sprigs. */
const CUP = { x: 95, y: 52, scale: 0.92 };
/** Where the score sits on the face, in view units. */
const FACE = { cy: 109, value: 46 };

function KoalaCup() {
  return (
    <G transform={`translate(${CUP.x} ${CUP.y}) scale(${CUP.scale})`}>
      <Rect x={22} y={124} width={76} height={14} rx={7} fill={colors.orange[600]} />
      <Rect x={26} y={118} width={68} height={12} rx={6} fill={colors.yellow[500]} />
      <Path d="M50 98h20l4 22H46Z" fill={colors.yellow[500]} />
      <Circle cx={20} cy={30} r={20} fill={colors.yellow[400]} />
      <Circle cx={100} cy={30} r={20} fill={colors.yellow[400]} />
      <Circle cx={20} cy={30} r={10} fill={colors.yellow[500]} />
      <Circle cx={100} cy={30} r={10} fill={colors.yellow[500]} />
      <Ellipse cx={60} cy={62} rx={44} ry={42} fill={colors.yellow[400]} />
      <Path d="M18 72c6 18 22 32 42 32s36-14 42-32c-8 12-22 20-42 20S26 84 18 72Z" fill={colors.yellow[500]} />
      <Ellipse cx={36} cy={36} rx={9} ry={6} fill={colors.yellow[100]} transform="rotate(-28 36 36)" />
      <Circle cx={50} cy={30} r={3} fill={colors.yellow[100]} />
    </G>
  );
}

/**
 * The App Store score set in a golden koala-head trophy, under an arc of
 * stars and between two laurel sprigs. Pops in piece by piece.
 */
export default function RatingTrophy({ value, label, size, enterAt }: Props) {
  const reducedMotion = useReducedMotion();
  const starsAt = enterAt + stagger.base * 2;
  const unit = size / VIEW_W;
  const height = VIEW_H * unit;
  const valueSize = FACE.value * unit;

  return (
    <View style={styles.root}>
      <View style={{ width: size, height }}>
        <Pop delay={enterAt} style={StyleSheet.absoluteFillObject}>
          <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
            <Branch />
            <G transform={`translate(${VIEW_W} 0) scale(-1 1)`}>
              <Branch />
            </G>
          </Svg>
        </Pop>

        <Pop delay={enterAt + stagger.base} style={StyleSheet.absoluteFillObject}>
          <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
            <KoalaCup />
          </Svg>
          <View
            style={[
              styles.value,
              { left: 0, right: 0, top: (FACE.cy - FACE.value * 0.62) * unit },
            ]}
          >
            <Text style={[styles.valueText, { fontSize: valueSize, lineHeight: valueSize * 1.2 }]}>
              {value}
            </Text>
          </View>
        </Pop>

        {STARS.map((star, i) => (
          <LoopingTwinkle
            key={star.x}
            shape="star"
            x={star.x * unit}
            y={star.y * unit}
            size={star.r * 2 * unit}
            color={colors.reward.gold}
            delay={starsAt + i * stagger.base}
            period={star.period}
            active
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  value: { position: 'absolute', alignItems: 'center' },
  valueText: { fontFamily: fonts.semibold, color: colors.text.primary, letterSpacing: -1 },
  label: { ...typography.title.title3, fontFamily: fonts.semibold, color: colors.text.primary, marginTop: spacing.sm },
});
