import { Text } from '../common/Text';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown, ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import type { usePaywall } from '../../hooks/usePaywall';
import type { PaywallPackageOption } from '../../services/paywall';
import PaywallTrialReminderToggle from './PaywallTrialReminderToggle';
import {
  formatCurrencyLike,
  packagePriceCents,
} from '../../lib/paywall/planPrice';
import Icon from '../common/icons/Icon';
import ChunkyButton from '../common/ChunkyButton';
import CloseButton from '../common/CloseButton';
import ConfettiFall from '../common/ConfettiFall';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing, spring, stagger } from '../../theme/motion';
import { secondsUntilDeadline } from '../../lib/paywall/exitOfferCountdown';
import ScreenContent from '../common/ScreenContent';
import OfferGiftArt from './OfferGiftArt';
import OfferPlanCard from './OfferPlanCard';
import { paywallStepStyles } from '../onboarding/paywall/paywallStepStyles';

const OFFER_DURATION_SECONDS = 5 * 60;
const GIFT_BOX_SIZE = 320;
/** Taller than the standard primary — this is the one button on the screen. */
const CTA_MIN_HEIGHT = 60;
// The modal slides up first; the card waits for it to land so its fade is seen.
const CARD_DELAY = duration.slow;
const CARD_ENTRANCE = FadeInDown.delay(CARD_DELAY)
  .duration(duration.slower)
  .easing(easing.settle)
  .reduceMotion(ReduceMotion.System);
const CONTENT_DELAY = CARD_DELAY + duration.base;
const GIFT_OPEN_DELAY = CONTENT_DELAY + duration.slow;
const MASCOT_ENTRANCE = ZoomIn.delay(CONTENT_DELAY)
  .springify()
  .damping(spring.pop.damping)
  .stiffness(spring.pop.stiffness)
  .mass(spring.pop.mass)
  .reduceMotion(ReduceMotion.System);

function contentEntrance(step: number) {
  return FadeInDown.delay(CONTENT_DELAY + (step + 1) * stagger.base)
    .duration(duration.slow)
    .easing(easing.settle)
    .reduceMotion(ReduceMotion.System);
}

export type ExitOfferPaywall = ReturnType<typeof usePaywall>;

export type ExitOfferVariant = 'priceDrop' | 'gift';

export function confirmExitOffer(
  onConfirm: () => void,
  discountPercent?: number | null,
) {
  Alert.alert(
    'Are you sure?',
    discountPercent != null
      ? `This ${discountPercent}% discount is only offered once. If you leave now, you won't see it again.`
      : "This offer is only shown once. If you leave now, you won't see it again.",
    [
      { text: 'Keep My Discount', style: 'cancel' },
      { text: 'Leave Offer', style: 'destructive', onPress: onConfirm },
    ],
    { cancelable: true },
  );
}

interface ExitOfferContentProps {
  variant: ExitOfferVariant;
  paywall: ExitOfferPaywall;
  anchorPaywall: ExitOfferPaywall;
  onPurchase: () => void;
  onRestore: () => void;
  onDecline?: () => void;
}

export function ExitOfferContent({
  variant,
  paywall,
  anchorPaywall,
  onPurchase,
  onDecline,
}: ExitOfferContentProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const [offerDeadlineMs] = useState(
    () => Date.now() + OFFER_DURATION_SECONDS * 1000,
  );
  const [secondsLeft, setSecondsLeft] = useState(() =>
    secondsUntilDeadline(offerDeadlineMs, Date.now()),
  );

  useWhileVisible(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const syncCountdown = () => {
      const next = secondsUntilDeadline(offerDeadlineMs, Date.now());
      setSecondsLeft(next);
      if (next === 0 && interval != null) {
        clearInterval(interval);
        interval = null;
      }
      return next;
    };

    if (syncCountdown() > 0) {
      interval = setInterval(syncCountdown, 1000);
    }

    return () => {
      if (interval != null) clearInterval(interval);
    };
  }, [offerDeadlineMs]);

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
  const monthly = useMemo(() => (annual ? computeMonthly(annual) : null), [annual]);
  const anchorPriceString = anchorAnnual?.priceString ?? null;

  const hasTrial = annual?.trialLabel != null;
  const isWaitingForAnchorPricing =
    annual != null && anchorAnnual == null && anchorPaywall.isLoading;
  const showInitialLoading =
    (paywall.isLoading && paywall.offering == null) || isWaitingForAnchorPricing;
  const isBusy =
    showInitialLoading ||
    paywall.isLoading ||
    paywall.isPurchasing ||
    paywall.isRestoring;
  // The offer sells exactly one package, so the CTA buys annual directly —
  // there is no plan selection step to read state from.
  const canBuy = annual != null;

  const ctaLabel = hasTrial
    ? 'Start My Free Trial'
    : variant === 'gift' ? 'Claim My Welcome Gift' : 'Get My Discount';

  const confirmDecline = () => {
    if (isBusy || onDecline == null) return;
    confirmExitOffer(onDecline, discountPercent);
  };

  return (
    <LinearGradient
      colors={variant === 'gift'
        ? [colors.surface.selected, colors.surface.selected]
        : [colors.surface.selected, colors.background.card]}
      style={styles.screen}
    >
      {variant === 'gift' ? (
        <ConfettiFall count={72} durationMs={7000} spread={1} startTop={0} fallDistance={windowHeight + 80} />
      ) : null}
      <View style={[styles.header, variant === 'gift' && styles.giftHeader, { paddingTop: insets.top + spacing.sm }]}>
        {onDecline != null ? (
          <CloseButton
            accessibilityLabel="Close offer"
            onPress={confirmDecline}
          />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, variant === 'gift' && styles.giftScroll]} showsVerticalScrollIndicator={false}>
        <ScreenContent style={styles.column}>
          {variant === 'gift' ? (
            <>
              <View style={styles.timerRow}>
                <Icon name="timer" size={16} color={colors.text.secondary} />
                <Text style={styles.timerLabel}>Offer ends in</Text>
                <Text style={styles.timerValue}>{formatClock(secondsLeft)}</Text>
              </View>
              <Animated.View entering={CARD_ENTRANCE} style={styles.offerWrap}>
                <LinearGradient
                  colors={[colors.primary.blue300, colors.primary.blue200, colors.primary.blue100]}
                  locations={[0, 0.5, 1]}
                  style={styles.offerCard}
                >
                  <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={StyleSheet.absoluteFill}
                  >
                    <Text style={[styles.percentMark, styles.percentTopLeft]}>%</Text>
                    <Text style={[styles.percentMark, styles.percentTopRight]}>%</Text>
                    <Text style={[styles.percentMark, styles.percentMiddleLeft]}>%</Text>
                    <Text style={[styles.percentMark, styles.percentMiddleRight]}>%</Text>
                  </View>
                  <View style={styles.offerMain}>
                    <Animated.View entering={contentEntrance(0)}>
                      <Text style={styles.title}>Your welcome gift</Text>
                    </Animated.View>
                    {showInitialLoading ? (
                      <ActivityIndicator color={colors.primary.blue700} style={styles.loading} />
                    ) : (
                      <>
                        {discountPercent != null ? (
                          <Animated.View entering={contentEntrance(1)} style={styles.discountWrap}>
                            <Text style={styles.discountHeadline} numberOfLines={1} adjustsFontSizeToFit>
                              {discountPercent}% OFF
                            </Text>
                          </Animated.View>
                        ) : null}
                        {monthly ? (
                          <Animated.View entering={contentEntrance(2)} style={styles.monthlyPill}>
                            <Text style={styles.monthlyPrice} numberOfLines={1} adjustsFontSizeToFit>
                              {monthly} / month
                            </Text>
                          </Animated.View>
                        ) : null}
                        <Animated.View entering={contentEntrance(3)} style={styles.reassuranceRow}>
                          <Icon name="check" size={18} color={colors.primary.blue700} />
                          <Text style={styles.reassuranceText}>One-time offer</Text>
                        </Animated.View>
                      </>
                    )}
                  </View>
                  {annual && !showInitialLoading ? (
                    <Animated.View
                      entering={FadeIn.delay(CONTENT_DELAY + 5 * stagger.base)
                        .duration(duration.slow)
                        .reduceMotion(ReduceMotion.System)}
                      style={styles.annualSummary}
                    >
                      <View style={styles.annualPriceRow}>
                        {discountPercent != null && anchorPriceString ? (
                          <>
                            <Text style={styles.priceAnchor}>{anchorPriceString}</Text>
                            <Icon name="arrow-right" size={22} color={colors.primary.blue800} />
                          </>
                        ) : null}
                        <Text style={styles.annualPrice}>{annual.priceString}</Text>
                      </View>
                      <Text style={styles.annualCaption}>For annual plan</Text>
                    </Animated.View>
                  ) : null}
                </LinearGradient>
                <Animated.View entering={MASCOT_ENTRANCE} style={styles.mascotWrap}>
                  <Image
                    source={require('../../../assets/blue_koala_hugging_gift_transparent.png')}
                    contentFit="contain"
                    style={styles.mascot}
                    accessibilityLabel="Azo holding a gift"
                  />
                </Animated.View>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View entering={MASCOT_ENTRANCE} style={styles.giftBox}>
                <OfferGiftArt size={Math.min(GIFT_BOX_SIZE, windowWidth - 2 * spacing.lg)} delay={GIFT_OPEN_DELAY} />
              </Animated.View>
              <Animated.View entering={contentEntrance(0)}>
                <Text style={paywallStepStyles.stepTitle}>Wait — a better price</Text>
              </Animated.View>
              <Animated.View entering={CARD_ENTRANCE}>
                {showInitialLoading ? (
                  <ActivityIndicator color={colors.text.primary} style={styles.loading} />
                ) : annual ? (
                  <OfferPlanCard pkg={annual} anchor={anchorAnnual} savingsPercent={discountPercent} />
                ) : null}
              </Animated.View>
            </>
          )}
          {paywall.errorMessage ? <Text style={styles.error}>{paywall.errorMessage}</Text> : null}
          {hasTrial && annual && !showInitialLoading ? <PaywallTrialReminderToggle /> : null}
        </ScreenContent>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <ScreenContent style={styles.footerColumn}>
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
          <Text style={styles.commitmentText}>No commitment — cancel anytime</Text>
        </ScreenContent>
      </View>
    </LinearGradient>
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
    <ChunkyButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      minHeight={CTA_MIN_HEIGHT}
      labelSize="xlarge"
      shape="pill"
    />
  );
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function computeMonthly(pkg: PaywallPackageOption): string | null {
  if (pkg.pricePerMonthString) return pkg.pricePerMonthString;
  const cents = packagePriceCents(pkg);
  if (cents == null) return null;
  return formatCurrencyLike(pkg.priceString, cents / 12 / 100);
}

function computeDiscountPercent(
  anchor: PaywallPackageOption | null,
  discounted: PaywallPackageOption | null,
): number | null {
  const anchorCents = packagePriceCents(anchor);
  const discountCents = packagePriceCents(discounted);
  if (anchorCents == null || discountCents == null || discountCents >= anchorCents) {
    return null;
  }
  return Math.round((1 - discountCents / anchorCents) * 100);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, alignItems: 'flex-end', minHeight: 80 },
  giftHeader: { alignItems: 'flex-start' },
  scroll: {
    flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  giftScroll: { paddingHorizontal: spacing.md },
  column: { alignItems: 'stretch', gap: spacing.md },
  timerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  timerLabel: { ...typography.caption.caption1, color: colors.text.secondary },
  timerValue: {
    ...typography.caption.caption1, fontFamily: fonts.semibold,
    color: colors.text.secondary, fontVariant: ['tabular-nums'],
  },
  offerWrap: { paddingTop: 48 },
  offerCard: {
    borderRadius: 44, borderCurve: 'continuous', overflow: 'hidden',
  },
  offerMain: {
    alignItems: 'center', paddingHorizontal: spacing.md,
    paddingTop: 90, paddingBottom: spacing['3xl'], gap: spacing.md,
  },
  mascotWrap: { position: 'absolute', top: 0, alignSelf: 'center', width: 140, height: 126 },
  mascot: { width: 140, height: 126 },
  percentMark: { position: 'absolute', fontFamily: fonts.heavy, fontSize: 54, lineHeight: 64, color: colors.primary.blue700, opacity: 0.08 },
  percentTopLeft: { top: 8, left: 15, transform: [{ rotate: '-22deg' }] },
  percentTopRight: { top: 23, right: 15, transform: [{ rotate: '18deg' }] },
  percentMiddleLeft: { top: 163, left: -16, transform: [{ rotate: '20deg' }] },
  percentMiddleRight: { top: 209, right: -12, transform: [{ rotate: '-18deg' }] },
  title: { fontFamily: fonts.semibold, fontSize: 27, lineHeight: 35, color: colors.primary.blue900, textAlign: 'center' },
  discountWrap: { alignSelf: 'stretch' },
  discountHeadline: {
    fontFamily: fonts.heavy, fontSize: 66, lineHeight: 79,
    color: colors.primary.blue700, textAlign: 'center', alignSelf: 'stretch',
  },
  monthlyPill: {
    backgroundColor: colors.background.card, borderRadius: 16,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, maxWidth: '100%',
  },
  monthlyPrice: { fontFamily: fonts.heavy, fontSize: 32, lineHeight: 44, color: colors.primary.blue900, textAlign: 'center' },
  reassuranceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  reassuranceText: { ...typography.body.small, color: colors.primary.blue700 },
  annualSummary: {
    alignItems: 'center', gap: spacing.xs, paddingTop: spacing.md,
    paddingHorizontal: spacing.md, paddingBottom: spacing['2xl'],
  },
  annualPriceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  priceAnchor: { ...typography.body.medium, color: colors.primary.blue800, textDecorationLine: 'line-through' },
  annualPrice: { ...typography.body.medium, fontFamily: fonts.heavy, color: colors.primary.blue900 },
  annualCaption: { ...typography.body.medium, color: colors.primary.blue800 },
  giftBox: { alignSelf: 'center' },
  loading: { paddingVertical: spacing['2xl'] },
  error: { ...typography.body.small, color: colors.error[500], textAlign: 'center' },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  footerColumn: { gap: spacing.sm },
  commitmentText: { ...typography.caption.caption1, color: colors.text.secondary, textAlign: 'center' },
});
