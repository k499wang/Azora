import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  Text as SvgText,
  TextPath,
} from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  size: number;
  /** false shows where the seal will go; true presses it down */
  stamped: boolean;
  /** fires as the seal meets the page, for the thud */
  onLand?: () => void;
}

const VIEW = 120;
const C = VIEW / 2;
const R_OUT = 56;
const R_IN = 38;
const R_TOP_TEXT = 44.5;
/** bottom lettering hangs inside its path, so the path sits further out */
const R_BOTTOM_TEXT = 50.5;
const INK = colors.primary.blue700;
const TILT = -12;
const PRESS_MS = 220;

const TOP_ARC = `M ${C - R_TOP_TEXT} ${C} A ${R_TOP_TEXT} ${R_TOP_TEXT} 0 0 1 ${C + R_TOP_TEXT} ${C}`;
const BOTTOM_ARC = `M ${C - R_BOTTOM_TEXT} ${C} A ${R_BOTTOM_TEXT} ${R_BOTTOM_TEXT} 0 0 0 ${C + R_BOTTOM_TEXT} ${C}`;
const DOT_R = (R_OUT + R_IN) / 2;

function Seal() {
  const year = new Date().getFullYear();
  const lettering = {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    fill: INK,
  };

  return (
    <G opacity={0.92}>
      <Defs>
        <Path id="pactSealTop" d={TOP_ARC} />
        <Path id="pactSealBottom" d={BOTTOM_ARC} />
      </Defs>
      <Circle cx={C} cy={C} r={R_OUT} fill="none" stroke={INK} strokeWidth={3} />
      <Circle cx={C} cy={C} r={R_IN} fill="none" stroke={INK} strokeWidth={1.4} />
      <SvgText {...lettering}>
        <TextPath href="#pactSealTop" startOffset="50%" textAnchor="middle">
          AZORA PACT
        </TextPath>
      </SvgText>
      <SvgText {...lettering}>
        <TextPath href="#pactSealBottom" startOffset="50%" textAnchor="middle">
          {`OFFICIAL · ${year}`}
        </TextPath>
      </SvgText>
      <Circle cx={C - DOT_R} cy={C} r={2.2} fill={INK} />
      <Circle cx={C + DOT_R} cy={C} r={2.2} fill={INK} />
      {/* Azo's paw, his mark on the pact */}
      <G fill={INK} transform={`translate(${C} ${C + 3})`}>
        <Path d="M -12 6 C -14 -4 -6 -9 0 -9 C 6 -9 14 -4 12 6 C 10 13 -10 13 -12 6 Z" />
        <Ellipse cx={-15} cy={-10} rx={4.2} ry={5.4} transform="rotate(-25 -15 -10)" />
        <Ellipse cx={-6} cy={-19} rx={4.4} ry={5.8} transform="rotate(-8 -6 -19)" />
        <Ellipse cx={6} cy={-19} rx={4.4} ry={5.8} transform="rotate(8 6 -19)" />
        <Ellipse cx={15} cy={-10} rx={4.2} ry={5.4} transform="rotate(25 15 -10)" />
      </G>
    </G>
  );
}

/**
 * The pact's seal. Before it is signed, a dashed ring marks the spot; on
 * confirm the stamp comes down onto the page, tilted like a hand stamp.
 */
export default function PactSeal({ size, stamped, onLand }: Props) {
  const reduceMotion = useReducedMotion();
  const press = useRef(new Animated.Value(0)).current;
  const onLandRef = useRef(onLand);
  onLandRef.current = onLand;

  useEffect(() => {
    if (!stamped) {
      press.setValue(0);
      return undefined;
    }
    if (reduceMotion) {
      press.setValue(1);
      onLandRef.current?.();
      return undefined;
    }
    const animation = Animated.timing(press, {
      toValue: 1,
      duration: PRESS_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onLandRef.current?.();
    });
    return () => animation.stop();
  }, [press, reduceMotion, stamped]);

  const stampStyle = {
    opacity: press.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
    transform: [
      { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1.7, 1] }) },
      {
        rotate: press.interpolate({
          inputRange: [0, 1],
          outputRange: [`${TILT + 10}deg`, `${TILT}deg`],
        }),
      },
    ],
  };

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {stamped ? null : (
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <Circle
            cx={C}
            cy={C}
            r={R_OUT}
            fill="none"
            stroke={colors.neutral[300]}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        </Svg>
      )}
      {stamped ? (
        <Animated.View style={[StyleSheet.absoluteFill, stampStyle]}>
          <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
            <Seal />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}
