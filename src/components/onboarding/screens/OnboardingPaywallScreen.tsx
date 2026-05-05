import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import type {
  PaywallOffering,
  PaywallPackageId,
} from '../../../services/paywall';

interface OnboardingPaywallScreenProps {
  offering: PaywallOffering | null;
  selectedPackageId: PaywallPackageId;
  stepIndex: number;
  stepCount: number;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  errorMessage: string | null;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  onPurchase: () => void;
  onRestore: () => void;
  onContinueWithoutPro: () => void;
  onBack: () => void;
}

const BENEFITS = [
  'Personalized daily breathwork plan',
  'Unlimited heart-rate and stress tracking',
  'Advanced HRV insights after each session',
  'Progress trends that show what is working',
];

export default function OnboardingPaywallScreen({
  offering,
  selectedPackageId,
  stepIndex,
  stepCount,
  isLoading,
  isPurchasing,
  isRestoring,
  errorMessage,
  onSelectPackage,
  onPurchase,
  onRestore,
  onContinueWithoutPro,
  onBack,
}: OnboardingPaywallScreenProps) {
  const selectedPackage = offering?.packages.find(
    (pkg) => pkg.id === selectedPackageId,
  );
  const isBusy = isLoading || isPurchasing || isRestoring;

  return (
    <OnboardingScreenLayout
      title="Unlock your full plan"
      subtitle="Your baseline is ready. Azora Pro keeps the plan adaptive as your nervous system changes."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <View style={styles.footer}>
          <OnboardingPrimaryButton
            label={selectedPackage?.trialLabel ?? 'Start Azora Pro'}
            onPress={onPurchase}
            loading={isPurchasing}
            disabled={isLoading || selectedPackage == null || isRestoring}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={onContinueWithoutPro}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              isBusy && styles.disabled,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Continue without Pro</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AZORA PRO</Text>
        </View>
        <Text style={styles.heroTitle}>Build consistency with feedback, not guesswork.</Text>
        <Text style={styles.heroBody}>
          Keep cloud sync free. Upgrade only for deeper guidance, unlimited
          measurement, and premium progress insights.
        </Text>
      </View>

      <View style={styles.benefitsCard}>
        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary.blue600} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      ) : (
        <View style={styles.packageList}>
          {offering?.packages.map((pkg) => {
            const isSelected = pkg.id === selectedPackageId;
            return (
              <Pressable
                key={pkg.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelectPackage(pkg.id)}
                style={({ pressed }) => [
                  styles.packageCard,
                  isSelected && styles.packageCardSelected,
                  pressed && styles.packageCardPressed,
                ]}
              >
                <View style={styles.packageTopRow}>
                  <View>
                    <View style={styles.packageTitleRow}>
                      <Text style={styles.packageTitle}>{pkg.title}</Text>
                      {pkg.isRecommended ? (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.packageSubtitle}>
                      {pkg.trialLabel ?? 'Flexible access'}
                    </Text>
                  </View>
                  <View style={styles.radioOuter}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{pkg.priceString}</Text>
                  <Text style={styles.priceMeta}>
                    {pkg.pricePerMonthString != null
                      ? `${pkg.pricePerMonthString} / month`
                      : pkg.subscriptionPeriod ?? ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.restoreRow}>
        <Pressable
          accessibilityRole="button"
          disabled={isLoading || isPurchasing || isRestoring}
          onPress={onRestore}
          style={({ pressed }) => [
            styles.restoreButton,
            pressed && styles.secondaryButtonPressed,
            (isLoading || isPurchasing || isRestoring) && styles.disabled,
          ]}
        >
          <Text style={styles.restoreText}>
            {isRestoring ? 'Restoring...' : 'Restore purchases'}
          </Text>
        </Pressable>
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Text style={styles.legal}>
        Payment is handled by the App Store. Subscriptions renew automatically
        unless cancelled in account settings.
      </Text>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.neutral[900],
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    backgroundColor: colors.primary.blue500,
  },
  badgeText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: colors.text.inverse,
  },
  heroTitle: {
    ...typography.title.title1,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  heroBody: {
    ...typography.body.medium,
    color: colors.neutral[200],
    lineHeight: 23,
  },
  benefitsCard: {
    borderRadius: 22,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[100],
  },
  checkmarkText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.success[700],
  },
  benefitText: {
    ...typography.body.medium,
    flex: 1,
    color: colors.text.primary,
  },
  loadingCard: {
    minHeight: 130,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  loadingText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  packageList: {
    gap: spacing.md,
  },
  packageCard: {
    borderRadius: 22,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background.elevated,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
  },
  packageCardSelected: {
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue100,
  },
  packageCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  packageTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  packageTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  recommendedBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.orange[100],
  },
  recommendedText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.orange[700],
  },
  packageSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.blue600,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  price: {
    ...typography.title.title2,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text.primary,
  },
  priceMeta: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  restoreRow: {
    alignItems: 'center',
  },
  restoreButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  restoreText: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.brand,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
  legal: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
  footer: {
    gap: spacing.sm,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.65,
  },
  secondaryButtonText: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  disabled: {
    opacity: 0.45,
  },
});
