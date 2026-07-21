import { Text } from '../common/Text';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { usePaywall } from '../../hooks/usePaywall';
import type {
  PaywallPackageId,
  PaywallPackageOption,
} from '../../services/paywall';
import PaywallTrialReminderToggle from './PaywallTrialReminderToggle';
import { computePerWeek, computeAnnualSavings } from './PlanCard';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';

const OFFER_DURATION_SECONDS = 5 * 60;

export type ExitOfferPaywall = ReturnType<typeof usePaywall>;

interface ExitOfferContentProps {
  paywall: ExitOfferPaywall;
  anchorPaywall: ExitOfferPaywall;
  onPurchase: () => void;
  onRestore: () => void;
  onDecline?: () => void;
}

export function ExitOfferContent({
  paywall,
  anchorPaywall,
  onPurchase,
  onDecline,
}: ExitOfferContentProps) {
  const insets = useSafeAreaInsets();

  const [secondsLeft, setSecondsLeft] = useState(OFFER_DURATION_SECONDS);
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const annual = useMemo(
    () => paywall.offering?.packages.find((pkg) => pkg.id === 'annual') ?? null,
    [paywall.offering],
  );
  const anchorAnnual = useMemo(
    () =>
      anchorPaywall.offering?.packages.find((pkg) => pkg.id === 'annual') ?? null,
    [anchorPaywall.offering],
  );
  const discountPercent = useMemo(
    () => computeDiscountPercent(anchorAnnual, annual),
    [anchorAnnual, annual],
  );
  const weekly = useMemo(
    () => paywall.offering?.packages.find((pkg) => pkg.id === 'weekly') ?? null,
    [paywall.offering],
  );
  const savingsPercent = useMemo(
    () => computeAnnualSavings(annual ?? undefined, weekly ?? undefined),
    [annual, weekly],
  );
  const monthly = useMemo(() => (annual ? computeMonthly(annual) : null), [annual]);
  const anchorPriceString = anchorAnnual?.priceString ?? null;

  const hasTrial = annual?.trialLabel != null;
  const selectedPackage = useMemo(
    () =>
      paywall.offering?.packages.find(
        (pkg) => pkg.id === paywall.selectedPackageId,
      ) ?? null,
    [paywall.offering, paywall.selectedPackageId],
  );
  const isWaitingForAnchorPricing =
    annual != null && anchorAnnual == null && anchorPaywall.isLoading;
  const showInitialLoading =
    (paywall.isLoading && paywall.offering == null) || isWaitingForAnchorPricing;
  const isBusy =
    showInitialLoading ||
    paywall.isLoading ||
    paywall.isPurchasing ||
    paywall.isRestoring;
  const canBuy = selectedPackage != null;

  const ctaLabel =
    selectedPackage?.trialLabel != null ? 'Start My Free Trial' : 'Continue';

  return (
    <View style={styles.screen}>
      {onDecline != null ? (
        <Pressable
          hitSlop={8}
          disabled={isBusy}
          onPress={onDecline}
          style={[styles.closeButton, { top: insets.top + spacing.sm }]}
        >
          <Icon name="close" size={24} color={colors.text.primary} />
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <Text
            style={[styles.title, { marginTop: insets.top + spacing['5xl'] }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Your one-time offer
          </Text>
          <Text style={styles.heroSubtitle}>
            A one-time special price for new users. Close this and it&apos;s
            gone for good.
          </Text>
        </View>

        {showInitialLoading ? (
          <ActivityIndicator color={colors.text.primary} style={styles.loading} />
        ) : (
          <Animated.View
            style={styles.revealedWrap}
            entering={FadeInUp.duration(660)}
          >
            <Animated.View
              style={styles.offerBlock}
              entering={FadeIn.delay(240).duration(620)}
            >
              <View style={styles.timerRow}>
                <Icon name="timer" size={20} color={colors.error[700]} />
                <Text style={styles.timerLabel}>Offer ends in</Text>
                <Text style={styles.timerValue}>{formatClock(secondsLeft)}</Text>
              </View>

              <View style={styles.priceCardWrap}>
                <View style={styles.priceBlock}>
                  {discountPercent != null ? (
                    <Text style={styles.discountHeadline}>{discountPercent}% OFF</Text>
                  ) : null}

                  <View style={styles.priceRow}>
                    {anchorPriceString ? (
                      <Text style={styles.priceAnchor}>{anchorPriceString}/year</Text>
                    ) : null}
                    {monthly ? (
                      <>
                        <Text style={styles.priceSecondary}>{monthly}</Text>
                        <Text style={styles.priceUnitSecondary}>/mo</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {SPARKLES.map((sparkle, i) => (
                    <TwinkleStar key={i} {...sparkle} />
                  ))}
                </View>
              </View>
            </Animated.View>

            {paywall.errorMessage ? (
              <Text style={styles.error}>{paywall.errorMessage}</Text>
            ) : null}

            <View style={styles.footer}>
              {hasTrial && annual ? <PaywallTrialReminderToggle /> : null}

              {annual ? (
                <OfferPlanCard
                  pkg={annual}
                  isSelected={paywall.selectedPackageId === 'annual'}
                  onSelect={paywall.selectPackage}
                  savingsPercent={savingsPercent}
                />
              ) : null}

              {annual == null && !paywall.isLoading ? (
                <PrimaryButton label="Try again" onPress={paywall.retryRevenueCatSync} disabled={isBusy} />
              ) : (
                <PrimaryButton
                  label={ctaLabel}
                  onPress={onPurchase}
                  disabled={isBusy || !canBuy}
                  loading={paywall.isPurchasing}
                />
              )}

              <View style={styles.commitmentRow}>
                <Text style={styles.commitmentText}>No commitment — cancel anytime</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

type Sparkle = {
  size: number;
  color: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  delay: number;
  duration: number;
  minOpacity: number;
  rotate: number;
};

const SPARKLES: Sparkle[] = [
  { size: 34, color: colors.primary.blue400, top: -20, left: -14, delay: 0, duration: 2100, minOpacity: 0.35, rotate: -18 },
  { size: 16, color: colors.primary.blue200, top: 34, left: -20, delay: 1300, duration: 1600, minOpacity: 0.4, rotate: 12 },
  { size: 22, color: colors.primary.blue300, bottom: -16, left: 28, delay: 520, duration: 2400, minOpacity: 0.3, rotate: 24 },
  { size: 28, color: colors.primary.blue400, top: -24, right: 30, delay: 880, duration: 1900, minOpacity: 0.35, rotate: 8 },
  { size: 40, color: colors.primary.blue300, top: 12, right: -22, delay: 1700, duration: 2600, minOpacity: 0.3, rotate: -14 },
  { size: 14, color: colors.primary.blue200, bottom: 6, right: -10, delay: 320, duration: 1500, minOpacity: 0.45, rotate: 30 },
  { size: 19, color: colors.primary.blue400, bottom: -12, right: 56, delay: 2050, duration: 2200, minOpacity: 0.35, rotate: -8 },
];

function TwinkleStar({
  size,
  color,
  top,
  bottom,
  left,
  right,
  delay,
  duration,
  minOpacity,
  rotate,
}: Sparkle) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: minOpacity + progress.value * (1 - minOpacity),
    transform: [
      { rotate: `${rotate}deg` },
      { scale: 0.78 + progress.value * 0.34 },
    ],
  }));

  return (
    <Animated.View style={[styles.sparkle, { top, bottom, left, right }, animatedStyle]}>
      <Icon name="star" size={size} color={color} />
    </Animated.View>
  );
}

function OfferPlanCard({
  pkg,
  isSelected,
  onSelect,
  savingsPercent,
}: {
  pkg: PaywallPackageOption;
  isSelected: boolean;
  onSelect: (packageId: PaywallPackageId) => void;
  savingsPercent: number | null;
}) {
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

  return (
    <View style={styles.planCardWrap}>
      {isAnnual && savingsPercent != null ? (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsBadgeText}>SAVE {savingsPercent}%</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        onPress={() => onSelect(pkg.id)}
        style={({ pressed }) => [
          styles.planCard,
          isSelected && styles.planCardSelected,
          pressed && styles.pressed,
        ]}
      >
        {hasTrial ? (
          <View style={styles.planBanner}>
            <Text style={styles.planBannerText}>{pkg.trialLabel?.toUpperCase()}</Text>
          </View>
        ) : null}
        <View style={styles.planBody}>
          <View style={styles.planCopy}>
            <Text style={styles.planName}>{headline}</Text>
            <Text style={styles.planMeta}>{planDetail}</Text>
          </View>
          <View style={styles.planPriceCol}>
            {perWeek ? <Text style={styles.planPerMonth}>{perWeek}/week</Text> : null}
            <Text style={styles.planMeta}>{secondary}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        pressed && styles.ctaPressed,
        (disabled || loading) && styles.ctaDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} />
      ) : (
        <Text style={styles.ctaText}>{label}</Text>
      )}
    </Pressable>
  );
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function parsePriceNumber(priceString: string | null | undefined): number | null {
  if (!priceString) return null;
  let cleaned = priceString.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalSep = lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : '';
  if (decimalSep) {
    const groupSep = decimalSep === ',' ? '.' : ',';
    cleaned = cleaned.split(groupSep).join('').replace(decimalSep, '.');
  } else {
    cleaned = cleaned.replace(/[.,]/g, '');
  }
  const value = parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Exact minor units (cents). Prefer RevenueCat's integer priceCents; only fall
// back to parsing the localized priceString when cents is unavailable.
function packageCents(pkg: PaywallPackageOption | null): number | null {
  if (pkg?.priceCents != null && pkg.priceCents > 0) return pkg.priceCents;
  const dollars = parsePriceNumber(pkg?.priceString);
  return dollars == null ? null : Math.round(dollars * 100);
}

function formatCurrencyLike(template: string, value: number): string {
  const prefix = template.match(/^[^\d]+/)?.[0] ?? '';
  const suffix = template.match(/[^\d]+$/)?.[0] ?? '';
  const formatted = value.toFixed(2);
  return prefix ? `${prefix}${formatted}` : `${formatted}${suffix || '$'}`;
}

function computeMonthly(pkg: PaywallPackageOption): string | null {
  if (pkg.pricePerMonthString) return pkg.pricePerMonthString;
  const cents = packageCents(pkg);
  if (cents == null) return null;
  return formatCurrencyLike(pkg.priceString, cents / 12 / 100);
}

function computeDiscountPercent(
  anchor: PaywallPackageOption | null,
  discounted: PaywallPackageOption | null,
): number | null {
  const anchorCents = packageCents(anchor);
  const discountCents = packageCents(discounted);
  if (anchorCents == null || discountCents == null || discountCents >= anchorCents) {
    return null;
  }
  return Math.round((1 - discountCents / anchorCents) * 100);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  loading: {
    paddingVertical: spacing['2xl'],
  },
  revealedWrap: {
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing['2xl'],
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 62,
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 0.3,
  },
  offerBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.lg,
  },
  priceCardWrap: {
    alignSelf: 'stretch',
    position: 'relative',
  },
  priceBlock: {
    ...card.base,
    ...card.shadow,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  sparkle: {
    position: 'absolute',
  },
  discountHeadline: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 56,
    color: colors.primary.blue700,
    textAlign: 'center',
    textAlignVertical: 'center',
    letterSpacing: 0.2,
    paddingTop: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  priceSecondary: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  priceUnitSecondary: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  priceAnchor: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.error[100],
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  timerLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: colors.error[700],
  },
  timerValue: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.error[700],
    fontVariant: ['tabular-nums'],
  },
  error: {
    ...typography.body.small,
    color: colors.error[500],
    textAlign: 'center',
  },
  footer: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
  planCardWrap: {
    position: 'relative',
  },
  planCard: {
    ...card.base,
    ...card.shadow,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  savingsBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.md,
    zIndex: 2,
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
    letterSpacing: 1,
    color: colors.text.inverse,
  },
  planCardSelected: {
    borderColor: colors.primary.blue500,
    borderWidth: 2,
    backgroundColor: colors.primary.blue100,
  },
  planBanner: {
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  planBannerText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 2,
    color: colors.neutral[0],
  },
  planBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  planCopy: {
    flex: 1,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planName: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
  },
  planMeta: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  planPerMonth: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
  },
  cta: {
    minHeight: 60,
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  ctaPressed: {
    backgroundColor: colors.primary.blue700,
    transform: [{ scale: 0.985 }],
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  commitmentRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitmentText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.6,
  },
});
