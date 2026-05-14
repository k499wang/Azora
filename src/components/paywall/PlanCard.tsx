import { Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  PaywallPackageId,
  PaywallPackageOption,
} from '../../services/paywall';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';

export const PRO_GOLD = colors.primary.blue600;
export const PRO_GOLD_SOFT = colors.primary.blue100;
export const PRO_INK = colors.primary.blue700;

interface PlanCardProps {
  pkg: PaywallPackageOption;
  isSelected: boolean;
  onSelect: (packageId: PaywallPackageId) => void;
  savingsPercent: number | null;
}

export function PlanCard({ pkg, isSelected, onSelect, savingsPercent }: PlanCardProps) {
  const isAnnual = pkg.id === 'annual';
  const perWeek = computePerWeek(pkg);
  const headline = isAnnual ? 'Annual' : 'Weekly';
  const secondary = isAnnual ? `${pkg.priceString}/year` : `${pkg.priceString}/week`;
  const trial = isAnnual ? '3-day free trial' : 'No free trial';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(pkg.id)}
      style={({ pressed }) => [
        styles.planCard,
        isSelected && styles.planCardSelected,
        pressed && styles.planCardPressed,
      ]}
    >
      {isAnnual && savingsPercent != null ? (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsBadgeText}>SAVE {savingsPercent}%</Text>
        </View>
      ) : null}

      <View style={styles.planCardBody}>
        <View style={styles.planCardLeft}>
          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected ? <View style={styles.radioInner} /> : null}
          </View>
          <View style={styles.planCardCopy}>
            <Text style={styles.planCardTitle}>{headline}</Text>
            <Text style={styles.planCardTrial}>{trial}</Text>
          </View>
        </View>
        <View style={styles.planCardRight}>
          {perWeek ? <Text style={styles.planCardPerWeek}>{perWeek}/wk</Text> : null}
          <Text style={styles.planCardSecondary}>{secondary}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function UrgencyBanner({ percent }: { percent: number }) {
  return (
    <View style={styles.urgencyBanner}>
      <View style={styles.urgencyDot} />
      <Text style={styles.urgencyText}>
        Limited-time offer — save {percent}% with annual
      </Text>
    </View>
  );
}

function parsePriceNumber(priceString: string | null | undefined): number | null {
  if (!priceString) return null;
  const cleaned = priceString.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  const match = cleaned.match(/\d+(\.\d+)?/);
  if (!match) return null;
  const value = parseFloat(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatCurrencyLike(template: string, value: number): string {
  const symbolMatch = template.match(/^[^\d.,\s-]+/);
  const symbol = symbolMatch ? symbolMatch[0] : '$';
  return `${symbol}${value.toFixed(2)}`;
}

export function computePerWeek(pkg: PaywallPackageOption): string | null {
  const value = parsePriceNumber(pkg.priceString);
  if (value == null) return null;
  const perWeek = pkg.id === 'annual' ? value / 52 : value;
  return formatCurrencyLike(pkg.priceString, perWeek);
}

export function computeAnnualSavings(
  annual: PaywallPackageOption | undefined,
  weekly: PaywallPackageOption | undefined,
): number | null {
  if (!annual || !weekly) return null;
  const annualValue = parsePriceNumber(annual.priceString);
  const weeklyValue = parsePriceNumber(weekly.priceString);
  if (annualValue == null || weeklyValue == null) return null;
  const annualPerWeek = annualValue / 52;
  if (weeklyValue <= 0) return null;
  const ratio = 1 - annualPerWeek / weeklyValue;
  if (ratio <= 0) return null;
  return Math.round(ratio * 100);
}

const styles = StyleSheet.create({
  planCard: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: PRO_INK,
    borderWidth: 2,
    shadowOpacity: 0.16,
  },
  planCardPressed: {
    opacity: 0.85,
  },
  planCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  planCardRight: {
    alignItems: 'flex-end',
  },
  planCardCopy: {
    flex: 1,
  },
  planCardTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  planCardTrial: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    marginTop: 2,
  },
  planCardPerWeek: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  planCardSecondary: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: PRO_INK,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRO_INK,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },
  savingsBadgeText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: PRO_GOLD_SOFT,
    borderWidth: 1,
    borderColor: PRO_GOLD,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRO_INK,
  },
  urgencyText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: PRO_INK,
  },
});
