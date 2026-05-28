import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const RING_START = 135;
const RING_SWEEP = 270;

interface Props {
  width: number;
  lungAge: number;
  ageScore: number;
  tierLabel: string;
  tierColor: string;
  comparison: string;
  holdTime: string;
  dateLabel: string;
}

export default function ShareCard({
  width,
  lungAge,
  ageScore,
  tierLabel,
  tierColor,
  comparison,
  holdTime,
  dateLabel,
}: Props) {
  const height = (width * 16) / 9;
  const ringSize = width * 0.66;
  const stroke = ringSize * 0.06;
  const ageFontSize = Math.round(ringSize * 0.3);

  const cx = ringSize / 2;
  const r = ringSize / 2 - stroke;
  const rect = Skia.XYWHRect(cx - r, cx - r, r * 2, r * 2);
  const track = Skia.Path.Make();
  track.addArc(rect, RING_START, RING_SWEEP);
  const arc = Skia.Path.Make();
  arc.addArc(rect, RING_START, RING_SWEEP * Math.max(0, Math.min(1, ageScore)));

  return (
    <View style={[styles.card, { width, height }]}>
      <View style={styles.brandRow}>
        <Text style={styles.brandWordmark}>Azora</Text>
      </View>

      <View style={styles.center}>
        <View style={[styles.ringWrap, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Path
              path={track}
              style="stroke"
              strokeWidth={stroke}
              strokeCap="round"
              color={tierColor + '26'}
            />
            <Path
              path={arc}
              style="stroke"
              strokeWidth={stroke}
              strokeCap="round"
              color={tierColor}
            />
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
            <Text style={[styles.tier, { color: tierColor }]}>{tierLabel}</Text>
          </View>
        </View>

        <Text style={styles.comparison}>{comparison}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.challenge}>
          I held my breath for {holdTime}. Can you beat me?
        </Text>
        <Text style={styles.handle}>tryazora.app · {dateLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    alignItems: 'center',
  },
  brandWordmark: {
    ...typography.title.title2,
    color: colors.primary.blue600,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  center: {
    alignItems: 'center',
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
  tier: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  comparison: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  challenge: {
    ...typography.body.medium,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  handle: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },
});
