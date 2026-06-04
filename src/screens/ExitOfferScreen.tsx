import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { usePaywall } from '../hooks/usePaywall';
import { PaywallPlacement, type PaywallPackageOption } from '../services/paywall';
import PaywallTrialReminderToggle from '../components/paywall/PaywallTrialReminderToggle';
import Icon from '../components/common/icons/Icon';
import type { ExitOfferScreenProps } from '../app/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { card } from '../theme/card';

const TERMS_URL = 'https://www.tryazora.app/terms';
const PRIVACY_URL = 'https://www.tryazora.app/privacy';
const OFFER_DURATION_SECONDS = 5 * 60;
const HERO_COLOR = colors.primary.blue900;

const APP_STORE_RATING = '5.0';
const LAUREL_SIZE = 92;
const TESTIMONIALS: { quote: string; name: string }[] = [
  {
    quote:
      'Breathwork through Azora has genuinely changed my life — my stress is down and my sleep has improved. Highly recommend.',
    name: 'Jessica R.',
  },
  {
    quote:
      'Azora helps me calm down with ease, and I’ve been sleeping better than ever. Thank you, Azora!',
    name: 'Jacob M.',
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
  const anchorPriceString = useMemo(
    () =>
      anchorPaywall.offering?.packages.find((pkg) => pkg.id === 'annual')
        ?.priceString ?? null,
    [anchorPaywall.offering],
  );
  const discountPercent = useMemo(
    () => computeDiscountPercent(anchorPriceString, annual?.priceString),
    [anchorPriceString, annual],
  );
  const monthly = useMemo(() => (annual ? computeMonthly(annual) : null), [annual]);
  const perWeek = useMemo(() => (annual ? computePerWeek(annual) : null), [annual]);

  const hasTrial = annual?.trialLabel != null;
  const isExpired = secondsLeft <= 0;
  const isBusy = paywall.isLoading || paywall.isPurchasing || paywall.isRestoring;
  const canBuy = annual != null && !isExpired;

  const close = useCallback(() => {
    if (paywall.isPurchasing || paywall.isRestoring) return;
    paywall.trackDismissed();
    navigation.goBack();
  }, [navigation, paywall]);

  const purchase = useCallback(async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const restore = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const headline =
    discountPercent != null ? `${discountPercent}% Off Forever` : 'Special Offer';
  const ctaLabel = hasTrial ? 'Start My Free Trial' : 'Claim Offer';

  return (
    <View style={styles.screen}>
      <View style={styles.heroWrap}>
        <ImageBackground
          source={require('../../assets/backgrounds/paywallbackground.jpg')}
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
          <View style={styles.heroOverlay} />
        </ImageBackground>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close offer"
          hitSlop={12}
          onPress={close}
          style={({ pressed }) => [
            styles.closeButton,
            { top: insets.top + spacing.xs },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>One Time{'\n'}Offer</Text>
          <Text style={styles.heroSubtitle}>You&apos;ll never see this again.</Text>
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {paywall.isLoading ? (
            <ActivityIndicator color={colors.text.primary} style={styles.loading} />
          ) : (
            <>
              <Text style={styles.headline}>{headline}</Text>
              {anchorPriceString || perWeek ? (
                <View style={styles.priceLine}>
                  {anchorPriceString ? (
                    <Text style={styles.originalPrice}>{anchorPriceString}</Text>
                  ) : null}
                  {anchorPriceString && perWeek ? (
                    <Text style={styles.dash}>—</Text>
                  ) : null}
                  {perWeek ? <Text style={styles.perWeek}>{perWeek}/week</Text> : null}
                </View>
              ) : null}
              <View style={[styles.timerBlock, isExpired && styles.dim]}>
                <Text style={styles.timerLabel}>
                  {isExpired ? 'OFFER EXPIRED' : 'OFFER EXPIRES IN'}
                </Text>
                <Text style={styles.timerValue}>{formatClock(secondsLeft)}</Text>
              </View>

              <View style={styles.social}>
                <Icon name="laurel" size={LAUREL_SIZE} color={colors.text.primary} />
                <View style={styles.reviewsCenter}>
                  <Text style={styles.stars}>★★★★★</Text>
                  <Text style={styles.ratingText}>{APP_STORE_RATING}</Text>
                </View>
                <View style={styles.laurelFlip}>
                  <Icon name="laurel" size={LAUREL_SIZE} color={colors.text.primary} />
                </View>
              </View>

              <View style={styles.reviews}>
                {TESTIMONIALS.map((testimonial) => (
                  <View key={testimonial.name} style={styles.review}>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewName}>{testimonial.name}</Text>
                      <Text style={styles.reviewStarsSmall}>★★★★★</Text>
                    </View>
                    <Text style={styles.reviewQuote}>{testimonial.quote}</Text>
                  </View>
                ))}
              </View>

              {paywall.errorMessage ? (
                <Text style={styles.error}>{paywall.errorMessage}</Text>
              ) : null}
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {hasTrial && annual ? (
            <PaywallTrialReminderToggle disabled={isExpired} />
          ) : null}

          {annual ? (
            <Text style={styles.fineprint}>
              {hasTrial
                ? `${annual.trialLabel}, then ${annual.priceString}/yr${monthly ? ` (${monthly}/mo)` : ''}. Cancel anytime.`
                : `Unlimited access for ${annual.priceString}/yr${monthly ? ` (${monthly}/mo)` : ''}. Cancel anytime.`}
            </Text>
          ) : null}

          {annual == null && !paywall.isLoading ? (
            <PrimaryButton label="Try again" onPress={paywall.retryRevenueCatSync} disabled={isBusy} />
          ) : isExpired ? (
            <PrimaryButton label="Continue" onPress={close} disabled={isBusy} />
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
      </View>
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

function computeMonthly(pkg: PaywallPackageOption): string | null {
  if (pkg.pricePerMonthString) return pkg.pricePerMonthString;
  const value = parsePriceNumber(pkg.priceString);
  if (value == null) return null;
  return formatCurrencyLike(pkg.priceString, value / 12);
}

function computePerWeek(pkg: PaywallPackageOption): string | null {
  const value = parsePriceNumber(pkg.priceString);
  if (value == null) return null;
  return formatCurrencyLike(pkg.priceString, value / 52);
}

function computeDiscountPercent(
  anchorPriceString: string | null,
  discountPriceString: string | null | undefined,
): number | null {
  const anchor = parsePriceNumber(anchorPriceString);
  const discount = parsePriceNumber(discountPriceString);
  if (anchor == null || discount == null || discount >= anchor) return null;
  return Math.round((1 - discount / anchor) * 100);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  heroWrap: {
    height: '32%',
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroShape: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HERO_COLOR,
    overflow: 'hidden',
    transform: [{ scaleX: 1.6 }],
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HERO_COLOR,
    opacity: 0.4,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue800,
  },
  closeIcon: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 17,
    lineHeight: 19,
    color: colors.neutral[0],
  },
  heroText: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 48,
    lineHeight: 52,
    color: colors.neutral[0],
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 19,
    lineHeight: 26,
    color: colors.neutral[200],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loading: {
    paddingVertical: spacing['2xl'],
  },
  headline: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 40,
    lineHeight: 44,
    color: colors.text.primary,
    textAlign: 'center',
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  originalPrice: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  dash: {
    ...typography.title.title3,
    color: colors.text.secondary,
  },
  perWeek: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timerBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  timerLabel: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 2,
    color: colors.text.secondary,
  },
  timerValue: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 68,
    lineHeight: 72,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  dim: {
    opacity: 0.45,
  },
  social: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginTop: spacing.lg,
  },
  reviewsCenter: {
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: -spacing.lg,
  },
  laurelFlip: {
    transform: [{ scaleX: -1 }],
  },
  reviews: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stars: {
    fontSize: 36,
    letterSpacing: 4,
    color: colors.orange[500],
  },
  ratingText: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  review: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  reviewMeta: {
    gap: 2,
  },
  reviewName: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  reviewStarsSmall: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.orange[500],
  },
  reviewQuote: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[500],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  fineprint: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    textAlign: 'center',
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
