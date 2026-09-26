import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../../theme/colors';
import { awardType } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';

interface Props {
  value: string;
  label: string;
  caption: string;
  size: number;
}

type Point = [number, number];

const VIEW_W = 260;
const VIEW_H = 230;
const INK = colors.neutral[900];

/** One branch's stem, from the bottom up the left side, kept wide of the copy. */
const STEM: [Point, Point, Point] = [
  [118, 216],
  [8, 212],
  [36, 72],
];
const LEAF_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
/** Leaves splay this far off the stem; the inner ones are smaller so they stay clear of the copy. */
const LEAF_ANGLE = 42;
const OUTER_LEAF = { rx: 13, ry: 5 };
const INNER_LEAF = { rx: 9, ry: 4 };
const TIP_LEAF = { rx: 11, ry: 4.6 };

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
    { point, rotate: angle - LEAF_ANGLE, ...OUTER_LEAF },
    { point, rotate: angle + LEAF_ANGLE, ...INNER_LEAF },
  ];
});
const TIP = stemAt(1);
LEAVES.push({ point: TIP.point, rotate: TIP.angle, ...TIP_LEAF });

const STEM_PATH = `M ${STEM[0].join(' ')} Q ${STEM[1].join(' ')} ${STEM[2].join(' ')}`;

function Branch() {
  return (
    <G>
      <Path
        d={STEM_PATH}
        stroke={INK}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {LEAVES.map((leaf, i) => (
        <G
          key={i}
          transform={`translate(${leaf.point[0]} ${leaf.point[1]}) rotate(${leaf.rotate})`}
        >
          <Ellipse cx={leaf.rx} cy={0} rx={leaf.rx} ry={leaf.ry} fill={INK} />
        </G>
      ))}
    </G>
  );
}

/** Five stars on an arc over the wreath, centres and radii in view units. */
const STARS = [
  { x: 66, y: 52, r: 11 },
  { x: 96, y: 34, r: 13 },
  { x: 130, y: 27, r: 15 },
  { x: 164, y: 34, r: 13 },
  { x: 194, y: 52, r: 9 },
];

/** The copy block sits between the branches, in view units. */
const COPY = { top: 86, height: 100, value: 58, label: 13 };

/**
 * An award-style rating: a black laurel, an arc of stars and the score set in
 * italic serif, on a soft white glow.
 */
export default function RatingWreath({ value, label, caption, size }: Props) {
  const unit = size / VIEW_W;
  const height = VIEW_H * unit;
  const valueSize = COPY.value * unit;
  const labelSize = COPY.label * unit;

  return (
    <View style={{ width: size, height }}>
      <Svg
        width={size}
        height={height}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.neutral[0]} stopOpacity={0.95} />
            <Stop
              offset="0.7"
              stopColor={colors.neutral[0]}
              stopOpacity={0.6}
            />
            <Stop offset="1" stopColor={colors.neutral[0]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={VIEW_W / 2}
          cy={VIEW_H / 2}
          r={VIEW_W * 0.6}
          fill="url(#glow)"
        />
        <Branch />
        <G transform={`translate(${VIEW_W} 0) scale(-1 1)`}>
          <Branch />
        </G>
      </Svg>

      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            { left: (star.x - star.r) * unit, top: (star.y - star.r) * unit },
          ]}
        >
          <Icon name="star" size={star.r * 2 * unit} color={INK} />
        </View>
      ))}

      <View
        style={[
          styles.copy,
          { top: COPY.top * unit, height: COPY.height * unit },
        ]}
      >
        <Text
          style={[
            styles.value,
            { fontSize: valueSize, lineHeight: valueSize * 1.15 },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.label,
            { fontSize: labelSize, lineHeight: labelSize * 1.4 },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.caption,
            { fontSize: labelSize, lineHeight: labelSize * 1.4 },
          ]}
        >
          {caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
  copy: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...awardType.italic,
    color: INK,
    letterSpacing: -1,
  },
  label: {
    ...awardType.italic,
    color: INK,
  },
  caption: {
    ...awardType.upright,
    color: INK,
  },
});
