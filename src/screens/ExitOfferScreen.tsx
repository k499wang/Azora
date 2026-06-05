import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
} from 'react-native-reanimated';
import { usePaywall } from '../hooks/usePaywall';
import {
  PaywallPlacement,
  type PaywallPackageId,
  type PaywallPackageOption,
} from '../services/paywall';
import PaywallTrialReminderToggle from '../components/paywall/PaywallTrialReminderToggle';
import {
  DiscountWheel,
  type DiscountWheelHandle,
} from '../components/paywall/DiscountWheel';
import {
  buildDiscountSegments,
  type WheelSegment,
} from '../lib/paywall/discountWheel';
import { AnalyticsEvent } from '../services/analytics/events';
import { computePerWeek, computeAnnualSavings } from '../components/paywall/PlanCard';
import Icon from '../components/common/icons/Icon';
import type { ExitOfferScreenProps } from '../app/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { card } from '../theme/card';

const TERMS_URL = 'https://www.tryazora.app/terms';
const PRIVACY_URL = 'https://www.tryazora.app/privacy';
const OFFER_DURATION_SECONDS = 5 * 60;
const REVEAL_DELAY_MS = 900;

const TESTIMONIALS = [
  {
    quote:
      'I finally sleep through the night. Two weeks of morning breathwork and my resting heart rate actually dropped.',
    name: 'Jake Sullivan',
  },
  {
    quote:
      "I've tried every meditation app out there. This is the first one that actually stuck for me.",
    name: 'Benny Marcs',
  },
];

export function ExitOfferScreen({ navigation }: ExitOfferScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const paywall = usePaywall({
    placement: PaywallPlacement.ExitDiscount,
    sourceScreen: 'exit_offer',
    sourceAction: 'onboarding_exit',
  });
  const anchorPaywall = usePaywall({
    placement: PaywallPlacement.ProfileUpgrade,
    sourceScreen: 'exit_offer_anchor',
  });

  const wheelRef = useRef<DiscountWheelHandle>(null);
  const allowDismissRef = useRef(false);
  const [phase, setPhase] = useState<'wheel' | 'revealed'>('wheel');
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    },
    [],
  );

  const [secondsLeft, setSecondsLeft] = useState(OFFER_DURATION_SECONDS);
  useEffect(() => {
    if (phase !== 'revealed') return;
    const id = setInterval(() => {
      setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

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
  const wheel = useMemo(
    () => (discountPercent != null ? buildDiscountSegments(discountPercent) : null),
    [discountPercent],
  );
  const isWaitingForWheelData =
    phase === 'wheel' &&
    wheel == null &&
    (paywall.isLoading || (annual != null && anchorPaywall.isLoading));

  // Nothing to spin for if the discount can't be derived — skip straight to the
  // offer rather than showing a wheel with no real prize.
  useEffect(() => {
    if (
      !paywall.isLoading &&
      (annual == null || !anchorPaywall.isLoading) &&
      wheel == null &&
      phase === 'wheel'
    ) {
      setPhase('revealed');
    }
  }, [anchorPaywall.isLoading, annual, paywall.isLoading, wheel, phase]);

  const spinViewedTracked = useRef(false);
  useEffect(() => {
    if (
      phase === 'wheel' &&
      wheel &&
      !paywall.isLoading &&
      !spinViewedTracked.current
    ) {
      spinViewedTracked.current = true;
      paywall.trackEvent(AnalyticsEvent.PaywallSpinViewed, {
        discount_percent: discountPercent,
      });
    }
  }, [phase, wheel, paywall, discountPercent]);

  const handleSpinStart = useCallback(() => {
    paywall.trackEvent(AnalyticsEvent.PaywallSpinStarted, {
      discount_percent: discountPercent,
    });
  }, [paywall, discountPercent]);

  const reveal = useCallback(
    (winner: WheelSegment) => {
      paywall.trackEvent(AnalyticsEvent.PaywallSpinCompleted, {
        discount_percent: discountPercent,
        spin_outcome_id: winner.id,
      });
      // Hold on the landed prize for a beat so the win registers, then
      // cross-fade into the offer.
      revealTimer.current = setTimeout(() => setPhase('revealed'), REVEAL_DELAY_MS);
    },
    [paywall, discountPercent],
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
  const showInitialLoading =
    (paywall.isLoading && paywall.offering == null) || isWaitingForWheelData;
  const isBusy =
    showInitialLoading ||
    paywall.isLoading ||
    paywall.isPurchasing ||
    paywall.isRestoring;
  const canBuy = selectedPackage != null;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isBusy });
    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [isBusy, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowDismissRef.current) return;

      if (isBusy) {
        event.preventDefault();
        return;
      }

      paywall.trackDismissed();
    });

    return unsubscribe;
  }, [isBusy, navigation, paywall]);

  const purchase = useCallback(async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const restore = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const ctaLabel = hasTrial
    ? 'Start My Free Trial →'
    : monthly
      ? `Continue — ${monthly}/mo`
      : 'Claim Offer';

  return (
    <View style={styles.screen}>
      <View style={styles.heroWrap}>
        <ImageBackground
          source={require('../../assets/backgrounds/sunset.jpg')}
          resizeMode="cover"
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
              'rgba(13,51,128,0.30)',
              'rgba(13,51,128,0.55)',
              'rgba(13,51,128,0.80)',
            ]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </ImageBackground>
        <Text style={styles.title}>Your one-time{'\n'}offer</Text>
        <Text style={styles.heroSubtitle}>
          A special price, today only — you won&apos;t see this again.
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
        ) : phase === 'wheel' && wheel ? (
          <Animated.View style={styles.wheelPhase} exiting={FadeOut.duration(280)}>
            <Text style={styles.wheelHeading}>
              Spin to unlock{'\n'}your discount
            </Text>
            <DiscountWheel
              ref={wheelRef}
              segments={wheel.segments}
              winningSegmentId={wheel.winningId}
              onSpinStart={handleSpinStart}
              onSpinComplete={reveal}
            />
            <PrimaryButton
              label="Spin the wheel"
              onPress={() => wheelRef.current?.spin()}
            />
          </Animated.View>
        ) : (
          <Animated.View
            style={styles.revealedWrap}
            entering={FadeInUp.duration(460)}
          >
            <Animated.View
              style={styles.offerBlock}
              entering={FadeIn.delay(160).duration(420)}
            >
              <View style={styles.timerPill}>
                <Icon name="timer" size={16} color={colors.primary.blue700} />
                <Text style={styles.timerLabel}>OFFER EXPIRES IN</Text>
                <Text style={styles.timerValue}>{formatClock(secondsLeft)}</Text>
              </View>

              <View style={styles.badge}>
                <Text style={styles.badgePercent}>
                  {discountPercent != null ? `${discountPercent}% OFF` : 'OFFER'}
                </Text>
                <Text style={styles.badgeForever}>FOREVER</Text>
              </View>

              <View style={styles.priceRow}>
                {anchorPriceString ? (
                  <Text style={styles.priceAnchor}>{anchorPriceString}</Text>
                ) : null}
                {monthly ? (
                  <Text style={styles.priceNow}>{monthly}/mo</Text>
                ) : null}
              </View>
            </Animated.View>

            <View style={styles.proofRow}>
              <View style={styles.proofItem}>
                <Icon name="laurel" size={72} color={colors.text.primary} />
                <View style={styles.proofCenter}>
                  <Text style={styles.proofStars}>★★★★★</Text>
                  <Text style={styles.proofRatingLabel}>5 STAR RATING</Text>
                </View>
                <View style={styles.laurelMirror}>
                  <Icon name="laurel" size={72} color={colors.text.primary} />
                </View>
              </View>
            </View>

            <View style={styles.testimonials}>
              {TESTIMONIALS.map((t) => (
                <View key={t.name} style={styles.testimonial}>
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
                  onPress={purchase}
                  disabled={isBusy || !canBuy}
                  loading={paywall.isPurchasing}
                />
              )}

              <View style={styles.links}>
                <Pressable hitSlop={6} disabled={isBusy} onPress={restore}>
                  <Text style={styles.linkText}>Restore Purchases</Text>
                </Pressable>
                <Pressable hitSlop={6} onPress={() => Linking.openURL(TERMS_URL)}>
                  <Text style={styles.linkText}>Terms &amp; Conditions</Text>
                </Pressable>
                <Pressable hitSlop={6} onPress={() => Linking.openURL(PRIVACY_URL)}>
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
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
  wheelPhase: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.xl,
  },
  wheelHeading: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  revealedWrap: {
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 42,
    lineHeight: 48,
    color: colors.neutral[0],
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue100,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  offerBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 28,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing['5xl'],
    alignItems: 'center',
    ...card.shadowElevated,
  },
  badgePercent: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 52,
    lineHeight: 56,
    color: colors.neutral[0],
    textAlign: 'center',
  },
  badgeForever: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 4,
    color: colors.neutral[200],
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  priceAnchor: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  priceNow: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
  },
  timerLabel: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 1,
    color: colors.primary.blue700,
  },
  timerValue: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue700,
    fontVariant: ['tabular-nums'],
  },
  proofRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  laurelMirror: {
    transform: [{ scaleX: -1 }],
  },
  proofCenter: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  proofRatingLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 1,
    color: colors.text.primary,
  },
  proofStars: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 2,
    color: colors.yellow[400],
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
    borderColor: colors.primary.blue600,
    borderWidth: 2,
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
    minHeight: 58,
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
  pressed: {
    opacity: 0.6,
  },
});
