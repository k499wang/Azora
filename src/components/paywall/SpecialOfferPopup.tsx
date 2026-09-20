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
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import ChunkyButton from '../common/ChunkyButton';

type SpecialOfferPaywall = ReturnType<typeof usePaywall>;

interface SpecialOfferPopupProps {
  paywall: SpecialOfferPaywall;
  anchorPaywall: SpecialOfferPaywall;
  onPurchased: () => void;
  onDismiss: () => void;
}

export function SpecialOfferPopup({
  paywall,
  anchorPaywall,
  onPurchased,
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
  const hasTrial = annual?.trialLabel != null;
  const isBusy = paywall.isLoading || paywall.isPurchasing || paywall.isRestoring;

  const handleDismiss = () => {
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onDismiss();
  };

  // This popup is the only surface that sells the discounted package, so the
  // charge goes through its own paywall rather than the host page's price.
  const purchaseSpecialOffer = async () => {
    const result = await paywall.purchaseSelectedPackage('annual');
    if (result.status === 'purchased' && result.isPro) {
      onPurchased();
    }
  };

  const handlePurchase = () => {
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    void purchaseSpecialOffer();
  };

  return (
    <Pressable style={styles.overlay} onPress={handleDismiss}>
      <Animated.View
        style={styles.popup}
        entering={FadeInDown.duration(300)}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.inner}>
          <View style={styles.content}>
            <Text style={styles.headline}>Your special offer</Text>
            <Text style={styles.subtitle}>
              A one-time price just for you. This won&apos;t show again.
            </Text>

            {annual ? (
              <View style={styles.priceBlock}>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{annual.priceString}</Text>
                  {anchorAnnual ? (
                    <Text style={styles.priceAnchor}>
                      {anchorAnnual.priceString}/year
                    </Text>
                  ) : null}
                </View>
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
  headline: {
    ...typography.title.title1,
    fontFamily: fonts.heavy,
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
  // The offer and the price it beats sit on one line, so the saving reads in a
  // single glance rather than as two numbers to compare vertically.
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
