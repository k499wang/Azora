import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, Polygon, Rect } from 'react-native-svg';
import { CHUNKY_LIP_DEPTH } from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/paths';
import { colors } from '../../theme/colors';
import { duration, spring } from '../../theme/motion';
import type { PathNodeAnchor } from './PathDayCard';

export interface LipTone {
  face: string;
  lip: string;
  icon: string;
  /** Diagonal bands of light across a coin's face, which replace its shine ring. */
  sheen?: string;
}

export type MeasureNode = () => Promise<PathNodeAnchor | null>;

const SHINE = colors.text.inverse;
const ICON_RAISE = 2;
/** A regular pointy-top hexagon is this much taller than it is wide. */
const HEX_TALL = 2 / Math.sqrt(3);
const RIM_INSET = 0.07;
/** How far the sheen reaches towards the rim, as a share of the face's radius. */
const SHEEN_REACH = 0.855;
/** Across the face's unit circle, each band edge is the line u + SHEEN_SLANT·v = edge. */
const SHEEN_SLANT = 0.75;
/** The first band runs out to the sheen's edge, so it takes the circle's curve. */
const SHEEN_BANDS = [
  { from: -2, to: -0.47 },
  { from: -0.04, to: 0.61 },
] as const;

export type LipShape = 'coin' | 'hex';

interface Props {
  size: number;
  shape?: LipShape;
  /** Width over face height; above 1 tilts the circle into a coin seen at an angle. */
  aspect?: number;
  depth?: number;
  tone: LipTone;
  onPress: (measure: MeasureNode) => void;
  accessibilityLabel?: string;
  children?: ReactNode;
}

/** ChunkyButton's face-on-a-lip as a coin or hex token that can say where it is when pressed. */
export default function LipToken({
  size,
  shape = 'coin',
  aspect = 1,
  depth = CHUNKY_LIP_DEPTH,
  tone,
  onPress,
  accessibilityLabel,
  children,
}: Props) {
  const ref = useRef<View>(null);
  const reducedMotion = useReducedMotion();
  const drop = useSharedValue(0);
  const faceHeight = (shape === 'hex' ? size * HEX_TALL : size) / aspect;

  const measure: MeasureNode = () =>
    new Promise((resolve) => {
      if (ref.current == null) {
        resolve(null);
        return;
      }
      ref.current.measureInWindow((x, y, width, height) =>
        resolve({ x, y, width, height }),
      );
    });

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value * depth }],
  }));

  return (
    <Pressable
      accessibilityRole={accessibilityLabel == null ? undefined : 'button'}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        drop.value = 1;
      }}
      onPressOut={() => {
        drop.value = reducedMotion
          ? withTiming(0, { duration: duration.fast })
          : withSpring(0, spring.bounce);
      }}
      onPress={() => onPress(measure)}
    >
      <View ref={ref} style={{ width: size, height: faceHeight + depth }}>
        <Svg width={size} height={faceHeight + depth} style={StyleSheet.absoluteFill}>
          {shape === 'hex' ? (
            <HexLip size={size} faceHeight={faceHeight} depth={depth} tone={tone} />
          ) : (
            <CoinLip size={size} faceHeight={faceHeight} depth={depth} tone={tone} />
          )}
        </Svg>
        <Animated.View style={[styles.face, { height: faceHeight }, faceStyle]}>
          <Svg width={size} height={faceHeight} style={StyleSheet.absoluteFill}>
            {shape === 'hex' ? (
              <HexFace size={size} faceHeight={faceHeight} tone={tone} />
            ) : (
              <CoinFace size={size} faceHeight={faceHeight} tone={tone} />
            )}
          </Svg>
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
}

interface ShapeProps {
  size: number;
  faceHeight: number;
  tone: LipTone;
}

function CoinLip({ size, faceHeight, depth, tone }: ShapeProps & { depth: number }) {
  return (
    <>
      <Rect x={0} y={faceHeight / 2} width={size} height={depth} fill={tone.lip} />
      <Ellipse
        cx={size / 2}
        cy={faceHeight / 2 + depth}
        rx={size / 2}
        ry={faceHeight / 2}
        fill={tone.lip}
      />
    </>
  );
}

function CoinFace({ size, faceHeight, tone }: ShapeProps) {
  return (
    <>
      <Ellipse
        cx={size / 2}
        cy={faceHeight / 2}
        rx={size / 2}
        ry={faceHeight / 2}
        fill={tone.face}
      />
      {tone.sheen == null ? (
        <Ellipse
          cx={size / 2}
          cy={faceHeight / 2}
          rx={size / 2 - size * RIM_INSET}
          ry={faceHeight / 2 - size * RIM_INSET}
          fill="none"
          stroke={SHINE}
          strokeOpacity={0.2}
          strokeWidth={size * 0.035}
        />
      ) : (
        <CoinSheen size={size} faceHeight={faceHeight} color={tone.sheen} />
      )}
    </>
  );
}

/** Bands run bottom-left to top-right inside a smaller copy of the face, leaving a plain rim. */
function CoinSheen({ size, faceHeight, color }: { size: number; faceHeight: number; color: string }) {
  const rx = size / 2;
  const ry = faceHeight / 2;
  const point = (edge: number, v: number) =>
    `${rx + (edge - SHEEN_SLANT * v) * rx},${ry + v * ry}`;
  return (
    <>
      <Defs>
        <ClipPath id="coinSheen">
          <Ellipse cx={rx} cy={ry} rx={rx * SHEEN_REACH} ry={ry * SHEEN_REACH} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#coinSheen)">
        {SHEEN_BANDS.map(({ from, to }) => (
          <Polygon
            key={from}
            points={[point(from, -1), point(to, -1), point(to, 1), point(from, 1)].join(' ')}
            fill={color}
          />
        ))}
      </G>
    </>
  );
}

/**
 * Corners are rounded by stroking a polygon pulled in by the corner's radius
 * with a round join, which lands the outline back on the full shape.
 */
function HexLip({ size, faceHeight, depth, tone }: ShapeProps & { depth: number }) {
  const corner = size * 0.08;
  return (
    <Polygon
      points={hexPoints(size, faceHeight, depth, corner)}
      fill={tone.lip}
      stroke={tone.lip}
      strokeWidth={corner * 2}
      strokeLinejoin="round"
    />
  );
}

function HexFace({ size, faceHeight, tone }: ShapeProps) {
  const corner = size * 0.08;
  return (
    <>
      <Polygon
        points={hexPoints(size, faceHeight, 0, corner)}
        fill={tone.face}
        stroke={tone.face}
        strokeWidth={corner * 2}
        strokeLinejoin="round"
      />
      <Polygon
        points={hexPoints(size, faceHeight, 0, corner + size * RIM_INSET)}
        fill="none"
        stroke={SHINE}
        strokeOpacity={0.2}
        strokeWidth={size * 0.035}
        strokeLinejoin="round"
      />
    </>
  );
}

/** A pointy-top hexagon seen at an angle, its sides dropped by `depth`, pulled in by `inset`. */
function hexPoints(width: number, height: number, depth: number, inset: number): string {
  const tall = height + depth;
  const scaleX = 1 - (2 * inset) / width;
  const scaleY = 1 - (2 * inset) / tall;
  return [
    [width / 2, 0],
    [width, height / 4],
    [width, (height * 3) / 4 + depth],
    [width / 2, height + depth],
    [0, (height * 3) / 4 + depth],
    [0, height / 4],
  ]
    .map(
      ([x, y]) =>
        `${width / 2 + (x - width / 2) * scaleX},${tall / 2 + (y - tall / 2) * scaleY}`,
    )
    .join(' ');
}

/** An icon stamped into a coin's face: raised off it on a shadow in the lip's colour. */
export function CoinIcon({
  name,
  size,
  tone,
}: {
  name: IconName;
  size: number;
  tone: LipTone;
}) {
  return (
    <View style={{ width: size, height: size + ICON_RAISE }}>
      <View style={[StyleSheet.absoluteFill, { top: ICON_RAISE }]}>
        <Icon name={name} size={size} color={tone.lip} />
      </View>
      <Icon name={name} size={size} color={tone.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
