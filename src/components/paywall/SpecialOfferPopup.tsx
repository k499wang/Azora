import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';
import type { usePaywall } from '../../hooks/usePaywall';
import type { PaywallPackageOption } from '../../services/paywall';
import { packagePriceCents } from '../../lib/paywall/planPrice';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import ChunkyButton from '../common/ChunkyButton';

type SpecialOfferPaywall = ReturnType<typeof usePaywall>;

interface SpecialOfferPopupProps {
  paywall: SpecialOfferPaywall;
  anchorPaywall: SpecialOfferPaywall;
  onPurchase: () => void;
  onDismiss: () => void;
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

export function SpecialOfferPopup({
  paywall,
  anchorPaywall,
  onPurchase,
  onDismiss,
}: SpecialOfferPopupProps) {
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

  const hasTrial = annual?.trialLabel != null;
  const isBusy = paywall.isLoading || paywall.isPurchasing || paywall.isRestoring;

  const handleDismiss = () => {
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onDismiss();
  };

  const handlePurchase = () => {
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPurchase();
  };

  return (
    <Pressable style={styles.overlay} onPress={handleDismiss}>
      <Animated.View
        style={styles.popup}
        entering={FadeInDown.duration(300)}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.inner}>
          <View style={styles.content}>
            {discountPercent != null ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            ) : null}

            <Text style={styles.headline}>Your special offer</Text>
            <Text style={styles.subtitle}>
              A one-time price just for you. This won&apos;t show again.
            </Text>

            {annual ? (
              <View style={styles.priceBlock}>
                {anchorAnnual ? (
                  <Text style={styles.priceAnchor}>{anchorAnnual.priceString}/year</Text>
                ) : null}
                <Text style={styles.price}>{annual.priceString}</Text>
                {annual.trialLabel ? (
                  <Text style={styles.priceDetail}>{annual.trialLabel}</Text>
                ) : null}
              </View>
            ) : null}

            {paywall.isLoading ? (
              <ActivityIndicator
                color={colors.primary.blue500}
                style={styles.loading}
              />
            ) : (
              <ChunkyButton
                label={hasTrial ? 'Start My Free Trial' : `${annual?.priceString ?? ''} — Get My Special Offer`}
                onPress={handlePurchase}
                disabled={isBusy || annual == null}
                loading={paywall.isPurchasing}
                style={styles.fullWidth}
              />
            )}

            <Pressable onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Unsure? You can decide later.</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: spacing.lg,
  },
  popup: {
    alignSelf: 'stretch',
    backgroundColor: colors.background.canvas,
    borderRadius: 24,
    overflow: 'hidden',
    ...card.shadow,
  },
  inner: {
    alignSelf: 'stretch',
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  discountBadge: {
    backgroundColor: colors.error[700],
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  discountText: {
    ...typography.heading.heading1,
    fontFamily: fonts.heavy,
    color: colors.neutral[0],
  },
  headline: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  priceBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  priceAnchor: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  price: {
    ...typography.title.title1,
    fontFamily: fonts.heavy,
    color: colors.primary.blue700,
  },
  priceDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  loading: {
    paddingVertical: spacing.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  dismissButton: {
    paddingVertical: spacing.xs,
  },
  dismissText: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});
