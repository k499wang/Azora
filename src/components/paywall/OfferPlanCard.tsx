import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import type { PaywallPackageOption } from '../../services/paywall';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';

interface Props {
  pkg: PaywallPackageOption;
  /** The regular annual plan the offer is measured against. */
  anchor: PaywallPackageOption | null;
  savingsPercent: number | null;
}

/** The paywall's selected plan card, rebuilt so the saving is the loudest thing on it. */
export default function OfferPlanCard({ pkg, anchor, savingsPercent }: Props) {
  const trialDuration = pkg.trialLabel?.replace(/\s+free trial$/i, '').toUpperCase() ?? null;
  const banner = [
    trialDuration ? `${trialDuration} FREE` : null,
    savingsPercent != null ? `SAVE ${savingsPercent}%` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.copy}>
          <Text style={styles.title}>Yearly</Text>
          <View style={styles.priceRow}>
            {savingsPercent != null && anchor ? (
              <Text style={styles.anchorPrice}>{anchor.priceString}</Text>
            ) : null}
            <Text style={styles.price}>{pkg.priceString}/year</Text>
          </View>
          {trialDuration ? (
            <Text style={styles.detail}>after your {pkg.trialLabel}</Text>
          ) : null}
        </View>
        <View style={styles.radio}>
          <View style={styles.radioDot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    backgroundColor: colors.background.card,
    borderColor: colors.primary.blue500,
    borderWidth: 2,
    overflow: 'hidden',
  },
  banner: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.blue500,
  },
  bannerText: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
    letterSpacing: 1,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  copy: { flex: 1, gap: spacing.xs },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.sm },
  anchorPrice: {
    ...typography.body.large,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  price: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
  },
  detail: { ...typography.body.medium, color: colors.text.secondary },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary.blue500,
  },
});
