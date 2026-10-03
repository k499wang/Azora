import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Rect } from 'react-native-svg';
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
}

export type MeasureNode = () => Promise<PathNodeAnchor | null>;

const SHINE = colors.text.inverse;
const ICON_RAISE = 2;

interface Props {
  size: number;
  /** Width over face height; above 1 tilts the circle into a coin seen at an angle. */
  aspect?: number;
  depth?: number;
  tone: LipTone;
  onPress: (measure: MeasureNode) => void;
  accessibilityLabel?: string;
  children?: ReactNode;
}

/** ChunkyButton's face-on-a-lip as a circle that can say where it is when pressed. */
export default function LipCircle({
  size,
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
  const faceHeight = size / aspect;

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
          <Rect x={0} y={faceHeight / 2} width={size} height={depth} fill={tone.lip} />
          <Ellipse
            cx={size / 2}
            cy={faceHeight / 2 + depth}
            rx={size / 2}
            ry={faceHeight / 2}
            fill={tone.lip}
          />
        </Svg>
        <Animated.View style={[styles.face, { height: faceHeight }, faceStyle]}>
          <Svg width={size} height={faceHeight} style={StyleSheet.absoluteFill}>
            <Ellipse
              cx={size / 2}
              cy={faceHeight / 2}
              rx={size / 2}
              ry={faceHeight / 2}
              fill={tone.face}
            />
            <Ellipse
              cx={size / 2}
              cy={faceHeight / 2}
              rx={size / 2 - size * 0.07}
              ry={faceHeight / 2 - size * 0.07}
              fill="none"
              stroke={SHINE}
              strokeOpacity={0.2}
              strokeWidth={size * 0.035}
            />
          </Svg>
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
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
