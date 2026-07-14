import { Text } from '../common/Text';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { SunsetBackground } from '../common/SunsetBackground';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';

const TERMS_URL = 'https://www.tryazora.app/terms';
const PRIVACY_URL = 'https://www.tryazora.app/privacy';
const OFFER_DURATION_SECONDS = 5 * 60;

const TESTIMONIALS = [
  {
    quote:
      'I finally sleep through the night. Two weeks of morning breathwork and my resting heart rate actually dropped.',
    name: 'Sunny W.',
  },
  {
    quote:
      "I've tried every meditation app out there. This is the first one that actually stuck for me.",
    name: 'Melody Z.',
  },
];

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
  onRestore,
  onDecline,
}: ExitOfferContentProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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
      <View style={styles.heroWrap}>
        <SunsetBackground
          style={[
            styles.heroShape,
            { borderBottomLeftRadius: width * 0.9, borderBottomRightRadius: width * 0.9 },
          ]}
          imageStyle={{
            borderBottomLeftRadius: width * 0.9,
            borderBottomRightRadius: width * 0.9,
          }}
        >
          <LinearGradient
            colors={[
              'rgba(30,99,214,0.18)',
              'rgba(21,74,171,0.46)',
              'rgba(13,51,128,0.78)',
            ]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </SunsetBackground>
        <Text style={styles.title}>Your one-time{'\n'}offer</Text>
        <Text style={styles.heroSubtitle}>
          A special price, reserved for you today.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
                    <View style={styles.discountPill}>
                      <Text style={styles.discountPillText}>
                        {discountPercent}% off, forever
                      </Text>
                    </View>
                  ) : null}

                  {monthly ? (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceNow}>{monthly}</Text>
                      <Text style={styles.priceUnit}>/mo</Text>
                    </View>
                  ) : null}

                  {anchorPriceString ? (
                    <Text style={styles.priceAnchor}>{anchorPriceString}/year</Text>
                  ) : null}
                </View>
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {SPARKLES.map((sparkle, i) => (
                    <TwinkleStar key={i} {...sparkle} />
                  ))}
                </View>
              </View>
            </Animated.View>

            <View style={styles.testimonials}>
              {TESTIMONIALS.map((t) => (
                <View key={t.name} style={styles.testimonial}>
                  <View style={styles.testimonialStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} name="star" size={20} color={colors.warning[500]} />
                    ))}
                  </View>
                  <Text style={styles.testimonialQuote}>{t.quote}</Text>
                  <Text style={styles.testimonialName}>{t.name}</Text>
                </View>
              ))}
            </View>

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

              {weekly ? (
                <OfferPlanCard
                  pkg={weekly}
                  isSelected={paywall.selectedPackageId === 'weekly'}
                  onSelect={paywall.selectPackage}
                  savingsPercent={null}
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

              <View style={styles.links}>
                <Pressable hitSlop={6} disabled={isBusy} onPress={onRestore}>
                  <Text style={styles.linkText}>Restore Purchases</Text>
                </Pressable>
                <Pressable hitSlop={6} onPress={() => Linking.openURL(TERMS_URL)}>
                  <Text style={styles.linkText}>Terms &amp; Conditions</Text>
                </Pressable>
                <Pressable hitSlop={6} onPress={() => Linking.openURL(PRIVACY_URL)}>
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Pressable>
              </View>

              {onDecline != null ? (
                <Pressable
                  hitSlop={8}
                  disabled={isBusy}
                  onPress={onDecline}
                  style={styles.declineButton}
                >
                  <Text style={styles.declineText}>No thanks</Text>
                </Pressable>
              ) : null}
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
      ? 'No charge today — cancel anytime'
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
  heroWrap: {
    height: '27%',
    minHeight: 180,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  heroShape: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    transform: [{ scaleX: 1.6 }],
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
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
    fontSize: 46,
    lineHeight: 52,
    color: colors.neutral[0],
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue100,
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
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sparkle: {
    position: 'absolute',
  },
  discountPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
  },
  discountPillText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: colors.primary.blue700,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  priceNow: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 68,
    lineHeight: 72,
    color: colors.primary.blue900,
    letterSpacing: 0.2,
  },
  priceUnit: {
    ...typography.title.title2,
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
  testimonials: {
    alignSelf: 'stretch',
    gap: spacing.xl,
    marginVertical: spacing.md,
  },
  testimonial: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  testimonialQuote: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  testimonialName: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
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
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  linkText: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
  },
  declineButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  declineText: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
});
