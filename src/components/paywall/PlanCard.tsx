import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import type {
  PaywallPackageId,
  PaywallPackageOption,
} from '../../services/paywall';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card, radius } from '../../theme/card';

const TRIAL_PILL_HEIGHT = 20;
/**
 * Shallower than the primary button's 4pt. These cards are half the width and
 * sit in a pair, so the same depth reads as a chunky slab rather than a surface
 * with a little give in it.
 */
const PLAN_LIP_DEPTH = 2;

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
  /**
   * `side-by-side` is the default narrow card: everything stacked and centred,
   * so two plans fit in one row and can be read against each other.
   * `full-width` is the wide single-line form — radio, copy and price on one
   * line — for surfaces showing only one plan, where a narrow card would sit
   * marooned in the middle of the screen.
   */
  layout?: 'side-by-side' | 'full-width';
}

export function PlanCard({
  pkg,
  isSelected,
  onSelect,
  savingsPercent,
  comparePerWeek,
  light = false,
  layout = 'side-by-side',
}: PlanCardProps) {
  const isSideBySide = layout === 'side-by-side';
  const isAnnual = pkg.id === 'annual';
  const hasTrial = pkg.trialLabel != null;
  const perWeek = computePerWeek(pkg);
  const headline = isAnnual ? (hasTrial ? 'Start for free' : 'Yearly') : 'Weekly';
  const planDetail = isAnnual
    ? hasTrial
      ? pkg.trialLabel ?? '7 day free trial'
      : `12mo · ${pkg.priceString}`
    : null;
  const trialDuration = pkg.trialLabel?.replace(/\s+free trial$/i, '').toUpperCase() ?? '7-DAY';
  const badgeText = isAnnual
    ? hasTrial
      ? savingsPercent != null
        ? `${trialDuration} FREE · SAVE ${savingsPercent}%`
        : `${trialDuration} FREE TRIAL`
      : savingsPercent != null
        ? `SAVE ${savingsPercent}%`
        : null
    : null;
  const strikePrice = isAnnual && savingsPercent != null ? comparePerWeek : null;
  const priceLabel = perWeek != null ? `${perWeek}/week` : pkg.priceString;
  // A per-week figure on a plan billed once a year is the single most misread
  // thing on a paywall, so the term and the real charge get said outright. The
  // weekly card needs no such line: its price already is its terms.
  const termsLabel = isAnnual
    ? hasTrial
      ? `Then ${pkg.priceString}/year`
      : `Billed yearly · ${pkg.priceString}`
    : 'Billed weekly';
  // The annual card's pill. It leads with the trial rather than the discount:
  // the free week is the thing being agreed to, and the saving only matters
  // once someone has decided to stay. It sits on the card's top edge, half in
  // and half out.
  const trialPillText = isAnnual
    ? hasTrial
      ? `${trialDuration} FREE TRIAL`
      : savingsPercent != null
        ? `SAVE ${savingsPercent}%`
        : null
    : null;

  // Two lines and a tick, nothing else. Side by side the cards are read against
  // each other, and a radio, a banner and a struck-through price are three more
  // things to compare before the only question that matters — which plan.
  if (isSideBySide) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        onPress={() => onSelect(pkg.id)}
        style={styles.planSlot}
      >
        {({ pressed }) => (
          <>
            <View
              style={[
                styles.planLip,
                light && styles.planLipLight,
                isSelected &&
                  (light ? styles.planLipSelectedLight : styles.planLipSelected),
              ]}
            >
              <View
                style={[
                  styles.planSurface,
                  light && styles.planSurfaceLight,
                  isSelected &&
                    (light
                      ? styles.planSurfaceSelectedLight
                      : styles.planSurfaceSelected),
                  pressed && styles.planSurfacePressed,
                ]}
              >
                <View style={styles.planSurfaceBody}>
                  <Text
                    style={[
                      styles.planSurfaceTitle,
                      light && styles.textPrimaryLight,
                    ]}
                  >
                    {headline}
                  </Text>

                  <View style={styles.planPriceBlock}>
                    <View style={styles.planPriceRow}>
                      {strikePrice ? (
                        <Text
                          style={[
                            styles.planSurfaceStrike,
                            light && styles.textFaintLight,
                          ]}
                        >
                          {strikePrice}
                        </Text>
                      ) : null}
                      <Text
                        style={[
                          styles.planSurfacePrice,
                          light && styles.textMutedLight,
                        ]}
                      >
                        {priceLabel}
                      </Text>
                    </View>
                    {termsLabel ? (
                      <Text
                        style={[
                          styles.planSurfaceTerms,
                          light && styles.textFaintLight,
                        ]}
                      >
                        {termsLabel}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* On the card rather than in it: inside, its height pushed this
                card's copy a strip lower than its neighbour's, so the two
                titles never sat on the same line. */}
            {trialPillText ? (
              <View style={styles.planTrialPillRow} pointerEvents="none">
                <View
                  style={[
                    styles.planTrialPill,
                    light && styles.planTrialPillLight,
                  ]}
                >
                  <Text style={styles.planTrialPillText}>{trialPillText}</Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </Pressable>
    );
  }

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
        <View style={styles.savingsBanner}>
          <Text style={styles.savingsBannerText}>{badgeText}</Text>
        </View>
      ) : null}

      <View style={styles.planCardBody}>
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
          {planDetail ? (
            <Text style={[styles.planCardDetail, light && styles.textMutedLight]}>
              {planDetail}
            </Text>
          ) : null}
        </View>
        <View style={styles.planCardRight}>
          {strikePrice ? (
            <Text style={[styles.planCardStrike, light && styles.textFaintLight]}>
              {strikePrice}
            </Text>
          ) : null}
          {perWeek ? (
            <Text style={[styles.planCardPerWeek, light && styles.textPrimaryLight]}>
              {perWeek}/week
            </Text>
          ) : null}
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
    overflow: 'hidden',
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
  planSlot: {
    flex: 1,
    // Clearance for the half of the pill that sits above the card's top edge.
    paddingTop: TRIAL_PILL_HEIGHT / 2,
  },
  // The same solid-face-on-a-darker-lip treatment as the primary button, so a
  // plan reads as a physical thing to press rather than a panel to look at.
  // Drawn as bottom padding rather than a negative transform on the face: the
  // card's layout box then equals what you see, and the two cards in the row
  // stay the same height.
  planLip: {
    flex: 1,
    paddingBottom: PLAN_LIP_DEPTH,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.blue900,
  },
  planLipSelected: {
    backgroundColor: colors.primary.blue800,
  },
  planLipLight: {
    backgroundColor: colors.neutral[300],
  },
  planLipSelectedLight: {
    backgroundColor: colors.primary.blue600,
  },
  planSurface: {
    ...card.base,
    flex: 1,
    backgroundColor: colors.primary.blue700,
    // Fixed across states so selecting a plan tints and outlines it without
    // resizing it — a card that grows on selection shoves its neighbour.
    borderWidth: 2,
    borderColor: colors.paywall.cardEdge,
  },
  planSurfaceSelected: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue300,
  },
  // Exactly the lip's depth, so the card lands flush with its bottom edge and
  // reads as fully depressed rather than nudged.
  planSurfacePressed: {
    transform: [{ translateY: PLAN_LIP_DEPTH }],
  },
  planSurfaceLight: {
    backgroundColor: colors.background.card,
    borderColor: colors.neutral[200],
  },
  planSurfaceSelectedLight: {
    backgroundColor: colors.primary.blue100,
    borderColor: colors.primary.blue600,
  },
  // Top-aligned, not centred: only the annual card carries a terms line, and
  // centring would float the two titles onto different lines.
  // One gap, and it falls between the plan and what it costs. The price and its
  // terms are a single thought, so they sit flush inside their own block rather
  // than being spaced apart like a third item.
  planSurfaceBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  planPriceBlock: {
    alignItems: 'center',
  },
  planTrialPillRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  planTrialPill: {
    height: TRIAL_PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: TRIAL_PILL_HEIGHT / 2,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.blue300,
  },
  planTrialPillLight: {
    backgroundColor: colors.primary.blue600,
  },
  planTrialPillText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
    letterSpacing: 1,
  },
  planSurfaceTerms: {
    ...typography.caption.caption1,
    color: colors.paywall.textFaint,
    textAlign: 'center',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  planSurfaceStrike: {
    ...typography.body.small,
    color: colors.paywall.textFaint,
    textDecorationLine: 'line-through',
  },
  planSurfaceTitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
    textAlign: 'center',
  },
  planSurfacePrice: {
    ...typography.body.small,
    color: colors.paywall.textMuted,
    textAlign: 'center',
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
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  planCardRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
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
  planCardDetail: {
    ...typography.caption.caption1,
    color: colors.paywall.textMuted,
    marginTop: 2,
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
  savingsBanner: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
    backgroundColor: colors.primary.blue600,
  },
  savingsBannerText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
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
