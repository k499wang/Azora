import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { computeAgeGap, ageScore } from '../../lib/lungAge';

interface Props {
  width: number;
  lungAge: number;
  userAge: number | null;
}

export default function ShareCard({ width, lungAge, userAge }: Props) {
  const height = width;
  const ringSize = width * 0.62;
  const stroke = ringSize * 0.06;
  const ageFontSize = Math.round(ringSize * 0.3);
  const score = ageScore(lungAge);
  const gap = computeAgeGap(lungAge, userAge);
  const arcColor = gap.ringColors[0];

  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const r = ringSize / 2 - stroke;
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);

  // Full circle track
  const track = Skia.Path.Make();
  track.addCircle(cx, cy, r);

  // Filled arc
  const arc = Skia.Path.Make();
  arc.addArc(rect, -90, 360 * Math.max(0, Math.min(1, score)));

  // Inner disc radius (nested white circles, same pattern as StressGauge)
  const innerR = r - stroke / 2 - 4;

  return (
    <View style={[styles.card, { width, height }]}>
      {/* Background image with quick fade to white */}
      <Image
        source={require('../../../assets/backgrounds/2066.jpg')}
        style={styles.bgImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
      <LinearGradient
        colors={[
          'rgba(248,251,255,0)',
          'rgba(248,251,255,0.55)',
          'rgba(248,251,255,1)',
        ]}
        locations={[0, 0.25, 0.45]}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <View style={styles.center}>
        <View style={[styles.ringWrap, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
          <Canvas style={StyleSheet.absoluteFill}>
            {/* Outer depth shadow (channel recess) */}
            <Path
              path={track}
              style="stroke"
              strokeWidth={stroke + 4}
              strokeCap="round"
              color="rgba(15,23,42,0.025)"
            />
            {/* Track — grey channel */}
            <Path
              path={track}
              style="stroke"
              strokeWidth={stroke}
              strokeCap="round"
              color={colors.neutral[100]}
            />
            {/* Inner depth shadow (channel recess) */}
            <Path
              path={track}
              style="stroke"
              strokeWidth={stroke - 3}
              strokeCap="round"
              color="rgba(15,23,42,0.035)"
            />
            {/* Colored arc — solid uniform color */}
            <Path
              path={arc}
              style="stroke"
              strokeWidth={stroke + 0.5}
              strokeCap="round"
              color={arcColor}
            />
            {/* Nested white inner disc */}
            <Circle cx={cx} cy={cy + 3} r={innerR + 3} color="rgba(15,23,42,0.04)" />
            <Circle cx={cx} cy={cy + 1.5} r={innerR + 1.5} color="rgba(15,23,42,0.02)" />
            <Circle cx={cx} cy={cy} r={innerR + 1} color={colors.neutral[200]} />
            <Circle cx={cx} cy={cy} r={innerR} color={colors.background.elevated} />
          </Canvas>
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={styles.caption}>Lung Age</Text>
            <Text
              style={[
                styles.ageValue,
                { fontSize: ageFontSize, lineHeight: Math.round(ageFontSize * 1.08) },
              ]}
            >
              {lungAge}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.watermark}>Azora</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  ageValue: {
    ...typography.display.display1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  watermark: {
    ...typography.title.title3,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
