import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
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
  /** Weekly plan's per-week price, struck through on the annual card. */
  comparePerWeek?: string | null;
  /** Light surfaces (exit offer) instead of the blue paywall background. */
  light?: boolean;
}

export function PlanCard({
  pkg,
  isSelected,
  onSelect,
  savingsPercent,
  comparePerWeek,
  light = false,
}: PlanCardProps) {
  const isAnnual = pkg.id === 'annual';
  const hasTrial = pkg.trialLabel != null;
  const perWeek = computePerWeek(pkg);
  const headline = isAnnual ? (hasTrial ? 'Try for free' : 'Annual') : 'Weekly';
  const secondary = isAnnual ? `${pkg.priceString}/year` : 'billed weekly';
  const planDetail = isAnnual
    ? hasTrial
      ? 'No charge today'
      : 'Annual subscription'
    : 'Weekly subscription';
  const badgeText = isAnnual
    ? hasTrial
      ? savingsPercent != null
        ? `7 DAYS FREE · SAVE ${savingsPercent}%`
        : '7-DAY FREE TRIAL'
      : savingsPercent != null
        ? `SAVE ${savingsPercent}%`
        : null
    : null;
  const strikePrice = isAnnual && savingsPercent != null ? comparePerWeek : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(pkg.id)}
      style={({ pressed }) => [
        styles.planCard,
        light && styles.planCardLight,
        isSelected && (light ? styles.planCardSelectedLight : styles.planCardSelected),
        pressed && styles.planCardPressed,
      ]}
    >
      {badgeText ? (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsBadgeText}>{badgeText}</Text>
        </View>
      ) : null}

      <View style={styles.planCardBody}>
        <View style={styles.planCardLeft}>
          <View
            style={[
              styles.radio,
              light && styles.radioLight,
              isSelected && (light ? styles.radioSelectedLight : styles.radioSelected),
            ]}
          >
            {isSelected ? (
              <View style={[styles.radioInner, light && styles.radioInnerLight]} />
            ) : null}
          </View>
          <View style={styles.planCardCopy}>
            <Text style={[styles.planCardTitle, light && styles.textPrimaryLight]}>
              {headline}
            </Text>
            <Text style={[styles.planCardTrial, light && styles.textMutedLight]}>
              {planDetail}
            </Text>
          </View>
        </View>
        <View style={styles.planCardRight}>
          {perWeek ? (
            <View style={styles.planCardPriceRow}>
              {strikePrice ? (
                <Text style={[styles.planCardStrike, light && styles.textFaintLight]}>
                  {strikePrice}
                </Text>
              ) : null}
              <Text style={[styles.planCardPerWeek, light && styles.textPrimaryLight]}>
                {perWeek}/week
              </Text>
            </View>
          ) : null}
          <Text style={[styles.planCardSecondary, light && styles.textFaintLight]}>
            {secondary}
          </Text>
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
    // Both states are opaque brand blue; selection reads as the brighter step
    // plus the lit border and glow, never as a change in transparency.
    backgroundColor: colors.primary.blue700,
    borderColor: colors.paywall.cardEdge,
    // Border width stays fixed across states so selecting a plan doesn't
    // reflow the row — only the color changes.
    borderWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  planCardSelected: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue300,
    shadowColor: colors.primary.blue300,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  planCardLight: {
    backgroundColor: colors.background.card,
    borderColor: colors.neutral[200],
  },
  planCardSelectedLight: {
    backgroundColor: colors.primary.blue100,
    borderColor: colors.primary.blue500,
    shadowColor: colors.primary.blue500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  textPrimaryLight: {
    color: colors.text.primary,
  },
  textMutedLight: {
    color: colors.text.secondary,
  },
  textFaintLight: {
    color: colors.text.tertiary,
  },
  radioLight: {
    borderColor: colors.neutral[300],
  },
  radioSelectedLight: {
    borderColor: colors.primary.blue600,
  },
  radioInnerLight: {
    backgroundColor: colors.primary.blue600,
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
    fontWeight: '500',
    color: colors.neutral[0],
  },
  planCardTrial: {
    ...typography.caption.caption1,
    color: colors.paywall.textMuted,
    marginTop: 2,
  },
  planCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  planCardStrike: {
    ...typography.body.small,
    color: colors.paywall.textFaint,
    textDecorationLine: 'line-through',
  },
  planCardPerWeek: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
  },
  planCardSecondary: {
    ...typography.caption.caption2,
    color: colors.paywall.textFaint,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.paywall.controlEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.neutral[0],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral[0],
  },
  savingsBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.orange[500],
    shadowColor: colors.orange[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  savingsBadgeText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
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
    fontWeight: '500',
    color: PRO_INK,
  },
});
