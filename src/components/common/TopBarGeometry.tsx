import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

const DECOR_HEIGHT = 204;

interface Sparkle {
  xRatio: number;
  y: number;
  radius: number;
  opacity: number;
  rotation: number;
}

const SPARKLES: readonly Sparkle[] = [
  { xRatio: 0.04, y: 24, radius: 15, opacity: 0.24, rotation: 0 },
  { xRatio: 0.18, y: 48, radius: 9, opacity: 0.18, rotation: 45 },
  { xRatio: 0.33, y: 20, radius: 11, opacity: 0.2, rotation: 0 },
  { xRatio: 0.5, y: 48, radius: 7, opacity: 0.15, rotation: 45 },
  { xRatio: 0.67, y: 22, radius: 13, opacity: 0.22, rotation: 0 },
  { xRatio: 0.84, y: 46, radius: 10, opacity: 0.19, rotation: 45 },
  { xRatio: 0.97, y: 20, radius: 14, opacity: 0.23, rotation: 0 },
  { xRatio: 0.13, y: 82, radius: 7, opacity: 0.14, rotation: 45 },
  { xRatio: 0.29, y: 68, radius: 8, opacity: 0.16, rotation: 0 },
  { xRatio: 0.43, y: 92, radius: 6, opacity: 0.13, rotation: 45 },
  { xRatio: 0.58, y: 70, radius: 8, opacity: 0.16, rotation: 0 },
  { xRatio: 0.72, y: 88, radius: 7, opacity: 0.14, rotation: 45 },
  { xRatio: 0.88, y: 72, radius: 9, opacity: 0.17, rotation: 0 },
  { xRatio: 0.03, y: 124, radius: 11, opacity: 0.18, rotation: 45 },
  { xRatio: 0.97, y: 126, radius: 12, opacity: 0.19, rotation: 0 },
];

function createSparklePath(cx: number, cy: number, radius: number) {
  const waist = radius * 0.28;
  const shoulder = radius * 0.48;
  const taper = radius * 0.04;

  return [
    `M ${cx} ${cy - radius}`,
    `C ${cx + taper} ${cy - shoulder} ${cx + waist * 0.72} ${cy - waist * 1.15} ${cx + waist} ${cy - waist}`,
    `C ${cx + waist * 1.15} ${cy - waist * 0.72} ${cx + shoulder} ${cy - taper} ${cx + radius} ${cy}`,
    `C ${cx + shoulder} ${cy + taper} ${cx + waist * 1.15} ${cy + waist * 0.72} ${cx + waist} ${cy + waist}`,
    `C ${cx + waist * 0.72} ${cy + waist * 1.15} ${cx + taper} ${cy + shoulder} ${cx} ${cy + radius}`,
    `C ${cx - taper} ${cy + shoulder} ${cx - waist * 0.72} ${cy + waist * 1.15} ${cx - waist} ${cy + waist}`,
    `C ${cx - waist * 1.15} ${cy + waist * 0.72} ${cx - shoulder} ${cy + taper} ${cx - radius} ${cy}`,
    `C ${cx - shoulder} ${cy - taper} ${cx - waist * 1.15} ${cy - waist * 0.72} ${cx - waist} ${cy - waist}`,
    `C ${cx - waist * 0.72} ${cy - waist * 1.15} ${cx - taper} ${cy - shoulder} ${cx} ${cy - radius} Z`,
  ].join(' ');
}

interface TopBarGeometryProps {
  /** Pixels of tinted overscroll above the bar the pattern should also cover. */
  extendTop: number;
}

export default function TopBarGeometry({ extendTop }: TopBarGeometryProps) {
  const { width } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={[styles.layer, { top: -extendTop }]}>
      <Svg
        style={[styles.decor, { top: extendTop }]}
        width={width}
        height={DECOR_HEIGHT}
      >
        {SPARKLES.map((sparkle) => {
          const cx = width * sparkle.xRatio;

          return (
            <Path
              key={`${sparkle.xRatio}-${sparkle.y}`}
              d={createSparklePath(cx, sparkle.y, sparkle.radius)}
              fill={colors.neutral[0]}
              opacity={sparkle.opacity}
              transform={
                sparkle.rotation === 0
                  ? undefined
                  : `rotate(${sparkle.rotation} ${cx} ${sparkle.y})`
              }
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decor: {
    position: 'absolute',
    left: 0,
  },
});
