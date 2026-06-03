import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  count?: number;
}

const RING_WIDTH = 26;
const RING_HEIGHT = 7;
const PUNCH_HOLE_SIZE = 13;
const LEFT_OFFSET = -13;
const HOLE_LEFT_IN_GROUP = RING_WIDTH - PUNCH_HOLE_SIZE + 9;

// Shared geometry so the see-through cutout (BinderHoleMask) lines up exactly
// with the rendered rings.
export const BINDER_HOLE_CX = LEFT_OFFSET + HOLE_LEFT_IN_GROUP + PUNCH_HOLE_SIZE / 2;
export const BINDER_HOLE_R = PUNCH_HOLE_SIZE / 2;

export function binderHoleFractions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));
}

export default function BinderRings({ count = 3 }: Props) {
  return (
    <View style={styles.column} pointerEvents="none">
      {binderHoleFractions(count).map((f, i) => (
        <View
          key={i}
          style={[
            styles.ringGroup,
            { top: `${f * 100}%`, marginTop: -RING_HEIGHT / 2 },
          ]}
        >
          {/* Hole rim — thin edge over the real see-through cutout */}
          <View style={styles.punchHole} />

          {/* Plastic binder loop — rounded capsule shaded on both axes */}
          <View style={styles.ringOuter}>
            {/* Base: greyed rounded ends, lighter center (horizontal curvature) */}
            <LinearGradient
              colors={[
                colors.neutral[300],
                colors.neutral[200],
                colors.neutral[100],
                colors.neutral[200],
                colors.neutral[300],
              ]}
              locations={[0, 0.2, 0.5, 0.8, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ringBody}
            >
              {/* Overlay: top light, bottom dark (vertical tube curvature) */}
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.35)',
                  'rgba(255,255,255,0)',
                  'rgba(15,23,42,0.1)',
                ]}
                locations={[0, 0.45, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.verticalShade}
              />
              {/* Soft specular highlight near the upper-center */}
              <View style={styles.topHighlight} />
            </LinearGradient>
          </View>
        </View>
      ))}
    </View>
  );
}

interface MaskProps {
  width: number;
  height: number;
  inset: number;
  count?: number;
}

// Luminance mask for MaskedView: white keeps the card, black circles punch
// real see-through holes. `inset` accounts for the expanded mask bounds that
// keep the card's drop shadow from being clipped.
export function BinderHoleMask({ width, height, inset, count = 3 }: MaskProps) {
  const cardHeight = height - inset * 2;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <Mask id="binderHoles">
          <Rect x={0} y={0} width={width} height={height} fill="white" />
          {binderHoleFractions(count).map((f, i) => (
            <Circle
              key={i}
              cx={inset + BINDER_HOLE_CX}
              cy={inset + f * cardHeight}
              r={BINDER_HOLE_R}
              fill="black"
            />
          ))}
        </Mask>
      </Defs>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="white"
        mask="url(#binderHoles)"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    left: LEFT_OFFSET,
    top: 0,
    bottom: 0,
    width: RING_WIDTH,
    zIndex: 3,
  },
  ringGroup: {
    position: 'absolute',
    left: 0,
    width: RING_WIDTH,
    height: RING_HEIGHT,
  },
  ringOuter: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: RING_WIDTH,
    height: RING_HEIGHT,
    borderRadius: RING_HEIGHT / 2,
    elevation: 2,
    zIndex: 2,
  },
  ringBody: {
    width: RING_WIDTH,
    height: RING_HEIGHT,
    borderRadius: RING_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.neutral[300],
    overflow: 'hidden',
  },
  verticalShade: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_HEIGHT / 2,
  },
  topHighlight: {
    position: 'absolute',
    top: 1.5,
    alignSelf: 'center',
    width: RING_WIDTH * 0.32,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1.5,
  },
  punchHole: {
    position: 'absolute',
    left: HOLE_LEFT_IN_GROUP,
    top: (RING_HEIGHT - PUNCH_HOLE_SIZE) / 2,
    width: PUNCH_HOLE_SIZE,
    height: PUNCH_HOLE_SIZE,
    borderRadius: PUNCH_HOLE_SIZE / 2,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.18)',
    zIndex: 1,
  },
});
